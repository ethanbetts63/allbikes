import logging
from django.db import transaction
from django.db.models import F

from ..models import Order, Payment
from notifications.utils.email import send_customer_confirmation, send_admin_new_order
from product.models import Product
from inventory.models import Motorcycle

logger = logging.getLogger(__name__)


def handle_payment_intent_succeeded(payment_intent):
    intent_id = payment_intent['id']

    with transaction.atomic():
        try:
            payment = Payment.objects.select_related(
                'order__product', 'order__motorcycle'
            ).select_for_update().get(stripe_payment_intent_id=intent_id)
        except Payment.DoesNotExist:
            logger.error("Webhook: Payment not found for intent %s", intent_id)
            return

        # Idempotency — already processed
        if payment.status == 'succeeded':
            return

        payment.status = 'succeeded'
        payment.save(update_fields=['status', 'updated_at'])

        order = payment.order
        order.status = 'paid'
        order.amount_paid = payment.amount
        order.save(update_fields=['status', 'amount_paid', 'updated_at'])

        if order.payment_type == 'deposit':
            # Mark motorcycle as reserved
            updated = Motorcycle.objects.filter(
                pk=order.motorcycle_id,
                status='for_sale',
            ).update(status='reserved')

            if not updated:
                logger.warning(
                    "Webhook: Motorcycle %s was not 'for_sale' when deposit webhook fired for order %s",
                    order.motorcycle_id,
                    order.order_reference,
                )
        else:
            # Atomic stock decrement — log if sold out between intent and webhook
            updated = Product.objects.filter(
                pk=order.product_id,
                stock_quantity__gt=0,
            ).update(stock_quantity=F('stock_quantity') - 1)

            if not updated:
                logger.warning(
                    "Webhook: Product %s sold out between payment intent and webhook for order %s",
                    order.product_id,
                    order.order_reference,
                )

    send_customer_confirmation(order)
    send_admin_new_order(order)


def handle_payment_intent_failed(payment_intent):
    intent_id = payment_intent['id']

    try:
        payment = Payment.objects.get(stripe_payment_intent_id=intent_id)
    except Payment.DoesNotExist:
        logger.error("Webhook: Payment not found for intent %s", intent_id)
        return

    payment.status = 'failed'
    payment.save(update_fields=['status', 'updated_at'])
    # Order stays pending_payment — user can retry
