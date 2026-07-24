import logging
from django.db import transaction
from django.db.models import F

from ..models import Order, Payment
from notifications.utils.email import (
    send_customer_confirmation,
    send_admin_new_order,
    send_hire_confirmation,
    send_admin_new_hire,
    send_parts_customer_confirmation,
    send_parts_admin_new_order,
)
from product.models import Product

logger = logging.getLogger(__name__)


def handle_payment_intent_succeeded(payment_intent):
    intent_id = payment_intent['id']

    with transaction.atomic():
        try:
            payment = Payment.objects.select_related(
                'order__product', 'order__motorcycle', 'hire_booking__motorcycle', 'parts_order'
            ).select_for_update().get(stripe_payment_intent_id=intent_id)
        except Payment.DoesNotExist:
            logger.error("Webhook: Payment not found for intent %s", intent_id)
            return

        # Idempotency — already processed
        if payment.status == 'succeeded':
            return

        payment.status = 'succeeded'
        payment.save(update_fields=['status', 'updated_at'])

        if payment.hire_booking_id:
            booking = payment.hire_booking
            booking.status = 'confirmed'
            booking.save(update_fields=['status', 'updated_at'])
        elif payment.parts_order_id:
            parts_order = payment.parts_order
            parts_order.status = 'paid'
            parts_order.amount_paid = payment.amount
            parts_order.save(update_fields=['status', 'amount_paid', 'updated_at'])
            # Start the 14-day backorder hold clock for understocked lines.
            from django.utils import timezone
            parts_order.items.filter(
                backordered=True, backorder_since__isnull=True
            ).update(backorder_since=timezone.now().date())
        else:
            order = payment.order
            order.status = 'paid'
            order.amount_paid = payment.amount
            order.save(update_fields=['status', 'amount_paid', 'updated_at'])

            if order.payment_type == 'full':
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

    if payment.hire_booking_id:
        send_hire_confirmation(payment.hire_booking)
        send_admin_new_hire(payment.hire_booking)
    elif payment.parts_order_id:
        send_parts_customer_confirmation(payment.parts_order)
        send_parts_admin_new_order(payment.parts_order)
    else:
        send_customer_confirmation(payment.order)
        send_admin_new_order(payment.order)


def handle_payment_intent_failed(payment_intent):
    intent_id = payment_intent['id']

    try:
        payment = Payment.objects.get(stripe_payment_intent_id=intent_id)
    except Payment.DoesNotExist:
        logger.error("Webhook: Payment not found for intent %s", intent_id)
        return

    payment.status = 'failed'
    payment.save(update_fields=['status', 'updated_at'])
    # Booking/order stays pending_payment — user can retry
