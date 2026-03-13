import pytest

from payments.models import Payment
from payments.tests.factories.payment_factory import PaymentFactory
from payments.tests.factories.order_factory import OrderFactory


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
        from django.db import IntegrityError
        order_a = OrderFactory()
        order_b = OrderFactory()
        PaymentFactory(order=order_a, stripe_payment_intent_id='pi_duplicate')
        with pytest.raises(IntegrityError):
            PaymentFactory(order=order_b, stripe_payment_intent_id='pi_duplicate')
