import secrets
from django.db import models


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending_payment', 'Pending Payment'),
        ('paid', 'Paid'),
        ('dispatched', 'Dispatched'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
    ]

    product = models.ForeignKey(
        'product.Product',
        on_delete=models.PROTECT,
        related_name='orders',
    )
    order_reference = models.CharField(max_length=20, unique=True, blank=True)
    customer_name = models.CharField(max_length=200)
    customer_email = models.EmailField()
    customer_phone = models.CharField(max_length=50, blank=True)
    address_line1 = models.CharField(max_length=200)
    address_line2 = models.CharField(max_length=200, blank=True)
    suburb = models.CharField(max_length=100)
    state = models.CharField(max_length=10)
    postcode = models.CharField(max_length=10)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending_payment')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.order_reference

    def save(self, *args, **kwargs):
        if not self.order_reference:
            self.order_reference = _generate_reference()
        super().save(*args, **kwargs)


def _generate_reference():
    while True:
        token = secrets.token_hex(4).upper()
        ref = f'SS-{token}'
        if not Order.objects.filter(order_reference=ref).exists():
            return ref
