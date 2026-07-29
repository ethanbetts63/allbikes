import secrets

from django.db import models


def _generate_access_token():
    return secrets.token_urlsafe(32)


def _generate_reference():
    while True:
        reference = f'PR-{secrets.token_hex(4).upper()}'
        if not ProductOrder.objects.filter(order_reference=reference).exists():
            return reference


class ProductOrder(models.Model):
    """A full-price product purchase, currently used by the e-scooter store."""

    STATUS_CHOICES = [
        ('pending_payment', 'Pending Payment'),
        ('paid', 'Paid'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
    ]

    product = models.ForeignKey(
        'product.Product', on_delete=models.PROTECT, related_name='product_orders'
    )
    order_reference = models.CharField(max_length=20, unique=True, blank=True)
    access_token = models.CharField(
        max_length=64, unique=True, default=_generate_access_token, editable=False
    )

    customer_name = models.CharField(max_length=200)
    customer_email = models.EmailField()
    customer_phone = models.CharField(max_length=50, blank=True)
    address_line1 = models.CharField(max_length=200)
    address_line2 = models.CharField(max_length=200, blank=True)
    suburb = models.CharField(max_length=100)
    state = models.CharField(max_length=3)
    postcode = models.CharField(max_length=4)
    country = models.CharField(max_length=100, default='Australia')

    unit_price_incl_gst = models.DecimalField(
        max_digits=10, decimal_places=2,
        help_text='Effective product price snapshotted when the order was created.',
    )
    total = models.DecimalField(max_digits=10, decimal_places=2)
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

    def shipping_address_lines(self):
        lines = [self.address_line1]
        if self.address_line2:
            lines.append(self.address_line2)
        lines.extend((f'{self.suburb} {self.state} {self.postcode}', self.country))
        return lines
