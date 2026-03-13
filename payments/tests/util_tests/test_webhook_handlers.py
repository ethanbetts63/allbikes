import pytest

from payments.models import Order, Payment
from payments.utils.webhook_handlers import handle_payment_intent_succeeded, handle_payment_intent_failed
from payments.tests.factories.order_factory import OrderFactory
from payments.tests.factories.payment_factory import PaymentFactory
from product.tests.factories.product_factory import ProductFactory


def _intent(intent_id):
    return {'id': intent_id}


@pytest.mark.django_db
class TestHandlePaymentIntentSucceeded:
    """Tests for the payment_intent.succeeded webhook handler."""

    def test_marks_payment_succeeded_and_order_paid(self):
        """
        GIVEN a pending Payment and pending_payment Order
        WHEN the succeeded handler is called
        THEN Payment status becomes succeeded and Order status becomes paid.
        """
        order = OrderFactory(status='pending_payment')
        payment = PaymentFactory(order=order, stripe_payment_intent_id='pi_1', status='pending')

        handle_payment_intent_succeeded(_intent('pi_1'))

        payment.refresh_from_db()
        order.refresh_from_db()
        assert payment.status == 'succeeded'
        assert order.status == 'paid'

    def test_decrements_product_stock(self):
        """
        GIVEN a product with stock_quantity=5 and a pending payment
        WHEN the succeeded handler is called
        THEN stock_quantity is decremented by 1.
        """
        product = ProductFactory(stock_quantity=5)
        order = OrderFactory(status='pending_payment', product=product)
        PaymentFactory(order=order, stripe_payment_intent_id='pi_2', status='pending')

        handle_payment_intent_succeeded(_intent('pi_2'))

        product.refresh_from_db()
        assert product.stock_quantity == 4

    def test_is_idempotent_when_already_succeeded(self):
        """
        GIVEN a Payment already marked succeeded
        WHEN the succeeded handler is called again (duplicate webhook)
        THEN the handler returns without re-processing (order stays paid, no error).
        """
        product = ProductFactory(stock_quantity=5)
        order = OrderFactory(status='paid', product=product)
        PaymentFactory(order=order, stripe_payment_intent_id='pi_3', status='succeeded')

        handle_payment_intent_succeeded(_intent('pi_3'))

        product.refresh_from_db()
        # Stock should NOT be decremented again
        assert product.stock_quantity == 5

    def test_does_not_raise_when_stock_already_zero(self):
        """
        GIVEN a product with stock_quantity=0 (sold out between intent and webhook)
        WHEN the succeeded handler is called
        THEN no exception is raised (logged but not fatal).
        """
        product = ProductFactory(stock_quantity=0)
        order = OrderFactory(status='pending_payment', product=product)
        PaymentFactory(order=order, stripe_payment_intent_id='pi_4', status='pending')

        # Should not raise
        handle_payment_intent_succeeded(_intent('pi_4'))

        order.refresh_from_db()
        assert order.status == 'paid'

    def test_unknown_intent_id_does_not_raise(self):
        """
        GIVEN an intent_id that has no matching Payment
        WHEN the handler is called
        THEN no exception is raised.
        """
        handle_payment_intent_succeeded(_intent('pi_nonexistent'))


@pytest.mark.django_db
class TestHandlePaymentIntentFailed:
    """Tests for the payment_intent.payment_failed webhook handler."""

    def test_marks_payment_failed(self):
        """
        GIVEN a pending Payment
        WHEN the failed handler is called
        THEN the Payment status becomes failed.
        """
        order = OrderFactory(status='pending_payment')
        payment = PaymentFactory(order=order, stripe_payment_intent_id='pi_fail_1', status='pending')

        handle_payment_intent_failed(_intent('pi_fail_1'))

        payment.refresh_from_db()
        assert payment.status == 'failed'

    def test_order_remains_pending_payment(self):
        """
        GIVEN a pending_payment Order with a pending Payment
        WHEN the failed handler is called
        THEN the Order status stays pending_payment (user can retry).
        """
        order = OrderFactory(status='pending_payment')
        PaymentFactory(order=order, stripe_payment_intent_id='pi_fail_2', status='pending')

        handle_payment_intent_failed(_intent('pi_fail_2'))

        order.refresh_from_db()
        assert order.status == 'pending_payment'

    def test_unknown_intent_id_does_not_raise(self):
        """
        GIVEN an intent_id that has no matching Payment
        WHEN the handler is called
        THEN no exception is raised.
        """
        handle_payment_intent_failed(_intent('pi_nonexistent'))
