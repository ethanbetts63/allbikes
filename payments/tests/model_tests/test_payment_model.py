import pytest
from django.db import IntegrityError

from payments.models import Payment
from payments.tests.factories.payment_factory import PaymentFactory, HirePaymentFactory
from payments.tests.factories.order_factory import OrderFactory
from hire.tests.factories.hire_booking_factory import HireBookingFactory


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

    def test_one_to_one_relationship_with_order(self):
        """
        GIVEN an Order with a Payment
        WHEN accessed via order.payment
        THEN the correct Payment is returned.
        """
        payment = PaymentFactory()
        assert payment.order.payment == payment

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
        order_a = OrderFactory()
        order_b = OrderFactory()
        PaymentFactory(order=order_a, stripe_payment_intent_id='pi_duplicate')
        with pytest.raises(IntegrityError):
            PaymentFactory(order=order_b, stripe_payment_intent_id='pi_duplicate')

    def test_one_to_one_relationship_with_hire_booking(self):
        """
        GIVEN a HireBooking with a Payment
        WHEN accessed via hire_booking.payment
        THEN the correct Payment is returned.
        """
        payment = HirePaymentFactory()
        assert payment.hire_booking.payment == payment

    def test_hire_payment_has_null_order(self):
        """
        GIVEN a Payment linked to a HireBooking
        WHEN order is accessed
        THEN it is None.
        """
        payment = HirePaymentFactory()
        assert payment.order is None

    def test_order_payment_has_null_hire_booking(self):
        """
        GIVEN a Payment linked to an Order
        WHEN hire_booking is accessed
        THEN it is None.
        """
        payment = PaymentFactory()
        assert payment.hire_booking is None

    def test_hire_booking_one_to_one_is_enforced(self):
        """
        GIVEN a HireBooking that already has a Payment
        WHEN a second Payment is created for the same HireBooking
        THEN a database error is raised.
        """
        booking = HireBookingFactory()
        HirePaymentFactory(hire_booking=booking, stripe_payment_intent_id='pi_hire_a')
        with pytest.raises(IntegrityError):
            HirePaymentFactory(hire_booking=booking, stripe_payment_intent_id='pi_hire_b')
