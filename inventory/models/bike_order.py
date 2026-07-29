import secrets

from django.db import models


def _generate_access_token():
    return secrets.token_urlsafe(32)


def _generate_reference():
    while True:
        reference = f'BK-{secrets.token_hex(4).upper()}'
        if not BikeOrder.objects.filter(order_reference=reference).exists():
            return reference


class BikeOrder(models.Model):
    """A deposit against a motorcycle; fulfilment remains staff-managed."""

    STATUS_CHOICES = [
        ('pending_payment', 'Pending Payment'),
        ('paid', 'Paid'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
    ]

    motorcycle = models.ForeignKey(
        'inventory.Motorcycle', on_delete=models.PROTECT, related_name='bike_orders'
    )
    order_reference = models.CharField(max_length=20, unique=True, blank=True)
    access_token = models.CharField(
        max_length=64, unique=True, default=_generate_access_token, editable=False
    )
    selected_colour = models.CharField(max_length=100, blank=True)

    customer_name = models.CharField(max_length=200)
    customer_email = models.EmailField()
    customer_phone = models.CharField(max_length=50)
    deposit_amount = models.DecimalField(
        max_digits=10, decimal_places=2,
        help_text='Deposit Settings amount snapshotted when the order was created.',
    )
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending_payment')
    terms_accepted = models.BooleanField(default=False)
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
