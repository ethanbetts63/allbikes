from decimal import Decimal

import stripe
from django.conf import settings

from payments.models import Payment

STRIPE_MINIMUM = Decimal('0.50')
stripe.api_key = settings.STRIPE_SECRET_KEY


def create_or_reuse_payment_intent(*, target_field, target, amount, metadata):
    """Create one Stripe intent/payment row per target, reusing a matching pending one."""
    amount = max(Decimal(amount), STRIPE_MINIMUM)
    existing = Payment.objects.filter(**{target_field: target}).first()
    if existing:
        if existing.status == 'pending' and existing.amount == amount:
            intent = stripe.PaymentIntent.retrieve(existing.stripe_payment_intent_id)
            return intent.client_secret
        if existing.status == 'pending':
            try:
                stripe.PaymentIntent.cancel(existing.stripe_payment_intent_id)
            except Exception:
                pass
        existing.delete()

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
