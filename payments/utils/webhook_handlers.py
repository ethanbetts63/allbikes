import logging

from django.db import transaction
from django.db.models import F

from notifications.utils.email import (
    send_admin_new_hire,
    send_bike_admin_new_order,
    send_bike_customer_confirmation,
    send_hire_confirmation,
    send_parts_admin_new_order,
    send_parts_customer_confirmation,
    send_product_admin_new_order,
    send_product_customer_confirmation,
)
from inventory.models import Motorcycle
from payments.models import Payment
from product.models import Product

logger = logging.getLogger(__name__)


def handle_payment_intent_succeeded(payment_intent):
    intent_id = payment_intent['id']

    with transaction.atomic():
        try:
            payment = Payment.objects.select_related(
                'product_order__product',
                'bike_order__motorcycle',
                'hire_booking__motorcycle',
                'parts_order',
            ).select_for_update().get(stripe_payment_intent_id=intent_id)
        except Payment.DoesNotExist:
            logger.error("Webhook: Payment not found for intent %s", intent_id)
            return

        if payment.status == 'succeeded':
            return

        payment.status = 'succeeded'
        payment.save(update_fields=['status', 'updated_at'])

        if payment.product_order_id:
            order = payment.product_order
            order.status = 'paid'
            order.amount_paid = payment.amount
            order.save(update_fields=['status', 'amount_paid', 'updated_at'])
            updated = Product.objects.filter(
                pk=order.product_id, stock_quantity__gt=0
            ).update(stock_quantity=F('stock_quantity') - 1)
            if not updated:
                logger.warning(
                    "Webhook: Product %s sold out before payment completed for order %s",
                    order.product_id,
                    order.order_reference,
                )
        elif payment.bike_order_id:
            order = payment.bike_order
            motorcycle = Motorcycle.objects.select_for_update().get(pk=order.motorcycle_id)
            order.status = 'paid'
            order.amount_paid = payment.amount
            order.save(update_fields=['status', 'amount_paid', 'updated_at'])
            # New bikes are ordered in rather than held, so a deposit never takes
            # them off the market. Only used and demo stock gets reserved.
            if motorcycle.status == 'for_sale' and motorcycle.condition in ('used', 'demo'):
                motorcycle.status = 'reserved'
                motorcycle.save(update_fields=['status'])
            order.motorcycle = motorcycle
        elif payment.hire_booking_id:
            booking = payment.hire_booking
            booking.status = 'confirmed'
            booking.save(update_fields=['status', 'updated_at'])
        elif payment.parts_order_id:
            order = payment.parts_order
            order.status = 'paid'
            order.amount_paid = payment.amount
            order.save(update_fields=['status', 'amount_paid', 'updated_at'])
        else:
            raise ValueError(f'Payment {payment.pk} has no supported target.')

    if payment.product_order_id:
        send_product_customer_confirmation(payment.product_order)
        send_product_admin_new_order(payment.product_order)
    elif payment.bike_order_id:
        send_bike_customer_confirmation(payment.bike_order)
        send_bike_admin_new_order(payment.bike_order)
    elif payment.hire_booking_id:
        send_hire_confirmation(payment.hire_booking)
        send_admin_new_hire(payment.hire_booking)
    elif payment.parts_order_id:
        send_parts_customer_confirmation(payment.parts_order)
        send_parts_admin_new_order(payment.parts_order)


def handle_payment_intent_failed(payment_intent):
    intent_id = payment_intent['id']
    try:
        payment = Payment.objects.get(stripe_payment_intent_id=intent_id)
    except Payment.DoesNotExist:
        logger.error("Webhook: Payment not found for intent %s", intent_id)
        return
    # Stripe may deliver events out of order. A late failure must never regress
    # an attempt which has already been confirmed as successful.
    if payment.status == 'pending':
        payment.status = 'failed'
        payment.save(update_fields=['status', 'updated_at'])
