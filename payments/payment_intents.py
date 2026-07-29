from decimal import Decimal

import stripe
from django.conf import settings

from payments.models import Payment

STRIPE_MINIMUM = Decimal('0.50')
stripe.api_key = settings.STRIPE_SECRET_KEY


class PaymentIntentError(Exception):
    """A safe, customer-facing failure while preparing a payment attempt."""


def _mark_terminal_from_stripe(payment, intent):
    """Synchronise terminal Stripe states that may have arrived before a webhook."""
    stripe_status = getattr(intent, 'status', None)
    if stripe_status == 'canceled':
        payment.status = 'cancelled'
        payment.save(update_fields=['status', 'updated_at'])
        return True
    if stripe_status == 'succeeded':
        raise PaymentIntentError(
            'This payment has already succeeded. Please wait for the order confirmation.'
        )
    return False


def create_or_reuse_payment_intent(*, target_field, target, amount, metadata):
    """Create an attempt without deleting payment history or risking a second charge."""
    amount = max(Decimal(amount), STRIPE_MINIMUM)
    attempts = Payment.objects.filter(**{target_field: target})

    if attempts.filter(status='succeeded').exists():
        raise PaymentIntentError('This order already has a successful payment.')

    pending_attempts = list(attempts.filter(status='pending').order_by('-created_at', '-pk')[:2])
    if len(pending_attempts) > 1:
        raise PaymentIntentError(
            'This order has more than one pending payment. Please contact us before retrying.'
        )

    existing = pending_attempts[0] if pending_attempts else None
    if existing:
        try:
            intent = stripe.PaymentIntent.retrieve(existing.stripe_payment_intent_id)
        except Exception as exc:
            raise PaymentIntentError(
                'We could not verify the existing payment. Please try again.'
            ) from exc

        if not _mark_terminal_from_stripe(existing, intent):
            if existing.amount == amount:
                return intent.client_secret
            try:
                stripe.PaymentIntent.cancel(existing.stripe_payment_intent_id)
            except Exception as exc:
                # The outcome is unknown, so creating another intent could double-charge.
                raise PaymentIntentError(
                    'We could not safely replace the existing payment. Please try again.'
                ) from exc
            existing.status = 'cancelled'
            existing.save(update_fields=['status', 'updated_at'])

    intent = stripe.PaymentIntent.create(
        amount=int(amount * 100),
        currency='aud',
        automatic_payment_methods={'enabled': True},
        metadata=metadata,
    )
    Payment.objects.create(
        **{target_field: target},
        stripe_payment_intent_id=intent.id,
        amount=amount,
        status='pending',
    )
    return intent.client_secret
