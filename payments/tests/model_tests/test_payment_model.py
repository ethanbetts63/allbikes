import pytest
from django.db import IntegrityError

from payments.models import Payment
from payments.tests.factories.payment_factory import PaymentFactory, HirePaymentFactory
from payments.tests.factories.order_factory import ProductOrderFactory


@pytest.mark.django_db
class TestPaymentModel:
    """Tests for the Payment model."""

    def test_default_status_is_pending(self):
        """
        GIVEN a newly created Payment
        WHEN accessed
        THEN status defaults to 'pending'.
        """
        payment = PaymentFactory()
        assert payment.status == 'pending'

    def test_product_order_preserves_multiple_payment_attempts(self):
        """
        GIVEN an order with multiple attempts
        THEN every attempt remains available in its payment history.
        """
        payment = PaymentFactory()
        retry = PaymentFactory(
            product_order=payment.product_order,
            stripe_payment_intent_id='pi_product_retry',
        )
        assert list(payment.product_order.payments.order_by('pk')) == [payment, retry]

    def test_str_contains_intent_id_and_status(self):
        """
        GIVEN a Payment
        WHEN str() is called
        THEN it contains the stripe_payment_intent_id and status.
        """
        payment = PaymentFactory(stripe_payment_intent_id='pi_abc123', status='succeeded')
        result = str(payment)
        assert 'pi_abc123' in result
        assert 'succeeded' in result

    def test_stripe_payment_intent_id_is_unique(self):
        """
        GIVEN a Payment with a given stripe_payment_intent_id
        WHEN a second Payment is created with the same ID
        THEN a database error is raised.
        """
        order_a = ProductOrderFactory()
        order_b = ProductOrderFactory()
        PaymentFactory(product_order=order_a, stripe_payment_intent_id='pi_duplicate')
        with pytest.raises(IntegrityError):
            PaymentFactory(product_order=order_b, stripe_payment_intent_id='pi_duplicate')

    def test_hire_booking_preserves_multiple_payment_attempts(self):
        """
        GIVEN a hire booking with multiple attempts
        THEN every attempt remains available in its payment history.
        """
        payment = HirePaymentFactory()
        retry = HirePaymentFactory(
            hire_booking=payment.hire_booking,
            stripe_payment_intent_id='pi_hire_retry',
        )
        assert list(payment.hire_booking.payments.order_by('pk')) == [payment, retry]

    def test_hire_payment_has_null_product_order(self):
        """
        GIVEN a Payment linked to a HireBooking
        WHEN order is accessed
        THEN it is None.
        """
        payment = HirePaymentFactory()
        assert payment.product_order is None

    def test_order_payment_has_null_hire_booking(self):
        """
        GIVEN a Payment linked to an Order
        WHEN hire_booking is accessed
        THEN it is None.
        """
        payment = PaymentFactory()
        assert payment.hire_booking is None
