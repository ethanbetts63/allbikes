from decimal import Decimal
from unittest.mock import MagicMock, patch

import pytest

from payments.models import Payment
from payments.payment_intents import PaymentIntentError, create_or_reuse_payment_intent
from payments.tests.factories.order_factory import ProductOrderFactory


pytestmark = pytest.mark.django_db


def _metadata(order):
    return {'target_type': 'product_order', 'product_order_id': order.pk}


def test_changed_amount_cancels_old_attempt_and_preserves_it():
    order = ProductOrderFactory(total='100.00')
    old = Payment.objects.create(
        product_order=order,
        stripe_payment_intent_id='pi_old_amount',
        amount='90.00',
        status='pending',
    )
    remote_old = MagicMock(status='requires_payment_method')
    remote_new = MagicMock(id='pi_new_amount', client_secret='cs_new_amount')

    with patch('payments.payment_intents.stripe.PaymentIntent.retrieve', return_value=remote_old), \
         patch('payments.payment_intents.stripe.PaymentIntent.cancel') as cancel, \
         patch('payments.payment_intents.stripe.PaymentIntent.create', return_value=remote_new):
        secret = create_or_reuse_payment_intent(
            target_field='product_order', target=order,
            amount=Decimal('100.00'), metadata=_metadata(order),
        )

    old.refresh_from_db()
    assert secret == 'cs_new_amount'
    assert old.status == 'cancelled'
    cancel.assert_called_once_with('pi_old_amount')
    assert list(order.payments.values_list('stripe_payment_intent_id', flat=True)) == [
        'pi_old_amount', 'pi_new_amount'
    ]


def test_cancellation_failure_never_creates_a_second_intent_or_deletes_history():
    order = ProductOrderFactory(total='100.00')
    old = Payment.objects.create(
        product_order=order,
        stripe_payment_intent_id='pi_uncertain',
        amount='90.00',
        status='pending',
    )
    remote_old = MagicMock(status='requires_payment_method')

    with patch('payments.payment_intents.stripe.PaymentIntent.retrieve', return_value=remote_old), \
         patch('payments.payment_intents.stripe.PaymentIntent.cancel', side_effect=RuntimeError('timeout')), \
         patch('payments.payment_intents.stripe.PaymentIntent.create') as create:
        with pytest.raises(PaymentIntentError):
            create_or_reuse_payment_intent(
                target_field='product_order', target=order,
                amount=Decimal('100.00'), metadata=_metadata(order),
            )

    old.refresh_from_db()
    assert old.status == 'pending'
    assert order.payments.count() == 1
    create.assert_not_called()


def test_successful_attempt_blocks_another_intent():
    order = ProductOrderFactory(total='100.00')
    Payment.objects.create(
        product_order=order,
        stripe_payment_intent_id='pi_paid',
        amount='100.00',
        status='succeeded',
    )

    with patch('payments.payment_intents.stripe.PaymentIntent.create') as create:
        with pytest.raises(PaymentIntentError):
            create_or_reuse_payment_intent(
                target_field='product_order', target=order,
                amount=Decimal('100.00'), metadata=_metadata(order),
            )

    create.assert_not_called()
