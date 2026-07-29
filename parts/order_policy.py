"""Cross-endpoint invariants for parts-order state changes."""

from payments.models import Payment


PAYMENT_RECORD_REQUIRED_STATUSES = frozenset({'paid', 'refunded', 'partially_refunded'})


def has_payment_record(order):
    """Return whether any Payment record is associated with this parts order."""
    return Payment.objects.filter(parts_order_id=order.pk).exists()
