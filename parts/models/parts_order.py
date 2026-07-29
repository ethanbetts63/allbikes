import secrets

from django.db import models
from django.utils import timezone


def _generate_access_token():
    """Opaque customer-only token for the short-lived checkout/confirmation flow."""
    return secrets.token_urlsafe(32)


def _generate_reference():
    while True:
        ref = f'SP-{secrets.token_hex(4).upper()}'
        if not PartsOrder.objects.filter(order_reference=ref).exists():
            return ref


class PartsOrder(models.Model):
    """A multi-line parts order. No user accounts — identified by order_reference."""

    STATUS_CHOICES = [
        ('pending_payment', 'Pending Payment'),
        ('paid', 'Paid'),
        ('dispatched', 'Dispatched'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
        ('partially_refunded', 'Partially Refunded'),
    ]

    order_reference = models.CharField(max_length=20, unique=True, blank=True)
    access_token = models.CharField(max_length=64, unique=True, default=_generate_access_token, editable=False)

    customer_name = models.CharField(max_length=200)
    customer_email = models.EmailField()
    customer_phone = models.CharField(max_length=50, blank=True)

    address_line1 = models.CharField(max_length=200)
    address_line2 = models.CharField(max_length=200, blank=True)
    suburb = models.CharField(max_length=100)
    state = models.CharField(max_length=50, blank=True)
    postcode = models.CharField(max_length=20)
    country = models.CharField(max_length=100, default='Australia')

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending_payment')
    has_backorder = models.BooleanField(default=False, help_text="True if any line was understocked at order time.")
    backorder_hold_days = models.PositiveIntegerField(
        help_text="Backorder policy snapshotted from Parts Settings when the order is created.",
    )

    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    shipping = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    terms_accepted = models.BooleanField(default=False)
    admin_notes = models.TextField(blank=True, help_text="Internal notes (wholesaler chase-ups, etc.). Not shown to the customer.")
    dispatched_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.order_reference

    def save(self, *args, **kwargs):
        if not self.order_reference:
            self.order_reference = _generate_reference()
        super().save(*args, **kwargs)

    def recompute_rollup(self):
        """Refresh has_backorder and the refund rollup from the line items.

        Called after an admin changes a line's backorder/refund state. Does not
        override terminal states (cancelled) or downgrade a manual status.
        """
        items = list(self.items.all())
        self.has_backorder = any(i.backordered for i in items)
        refunded = [i for i in items if i.status == 'refunded']
        if self.status not in ('cancelled',):
            if items and len(refunded) == len(items):
                self.status = 'refunded'
            elif refunded and self.status in ('paid', 'dispatched'):
                self.status = 'partially_refunded'
        self.save(update_fields=['has_backorder', 'status', 'updated_at'])

    def backorder_days_remaining(self, hold_days=None):
        """Days left in the backorder hold, counted from the order date.

        The hold is a promise about the customer's *total* wait, so the clock
        starts when they paid — not when an operator noticed a part was short.
        Can be zero or negative, meaning the window has closed.
        """
        if hold_days is None:
            hold_days = self.backorder_hold_days
        ordered_on = timezone.localtime(self.created_at).date()
        return hold_days - (timezone.localdate() - ordered_on).days

    def backorder_window_expired(self, hold_days=None):
        """True once the order is too old to hold a part on backorder."""
        return self.backorder_days_remaining(hold_days) <= 0

    def shipping_address_lines(self, *, include_name=False, include_phone=False):
        """Canonical postal-address lines for admin and notification output."""
        lines = [self.customer_name] if include_name else []
        lines.append(self.address_line1)
        if self.address_line2:
            lines.append(self.address_line2)
        lines.extend((f'{self.suburb} {self.state} {self.postcode}'.strip(), self.country))
        if include_phone and self.customer_phone:
            lines.append(f'Phone: {self.customer_phone}')
        return lines
