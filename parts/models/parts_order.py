import secrets

from django.db import models


class PartsOrder(models.Model):
    """A multi-line parts order. No user accounts — identified by order_reference."""

    STATUS_CHOICES = [
        ('pending_payment', 'Pending Payment'),
        ('paid', 'Paid'),
        ('dispatched', 'Dispatched'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
        ('partially_refunded', 'Partially Refunded'),
    ]

    order_reference = models.CharField(max_length=20, unique=True, blank=True)

    customer_name = models.CharField(max_length=200)
    customer_email = models.EmailField()
    customer_phone = models.CharField(max_length=50, blank=True)

    address_line1 = models.CharField(max_length=200)
    address_line2 = models.CharField(max_length=200, blank=True)
    suburb = models.CharField(max_length=100)
    state = models.CharField(max_length=50, blank=True)
    postcode = models.CharField(max_length=20)
    country = models.CharField(max_length=100, default='Australia')
    is_international = models.BooleanField(default=False, help_text="Derived from country at order time; drives shipping fee.")

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending_payment')
    has_backorder = models.BooleanField(default=False, help_text="True if any line was understocked at order time.")

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


def _generate_reference():
    while True:
        ref = f'SP-{secrets.token_hex(4).upper()}'
        if not PartsOrder.objects.filter(order_reference=ref).exists():
            return ref
