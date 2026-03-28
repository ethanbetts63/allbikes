import secrets
from django.core.exceptions import ValidationError
from django.db import models


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending_payment', 'Pending Payment'),
        ('paid', 'Paid'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
    ]

    PAYMENT_TYPE_CHOICES = [
        ('full', 'Full Payment'),
        ('deposit', 'Deposit'),
    ]

    product = models.ForeignKey(
        'product.Product',
        on_delete=models.PROTECT,
        related_name='orders',
        null=True,
        blank=True,
    )
    motorcycle = models.ForeignKey(
        'inventory.Motorcycle',
        on_delete=models.PROTECT,
        related_name='orders',
        null=True,
        blank=True,
    )
    payment_type = models.CharField(
        max_length=10,
        choices=PAYMENT_TYPE_CHOICES,
        default='full',
    )
    order_reference = models.CharField(max_length=20, unique=True, blank=True)
    customer_name = models.CharField(max_length=200)
    customer_email = models.EmailField()
    customer_phone = models.CharField(max_length=50, blank=True)
    address_line1 = models.CharField(max_length=200, blank=True)
    address_line2 = models.CharField(max_length=200, blank=True)
    suburb = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=10, blank=True)
    postcode = models.CharField(max_length=10, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending_payment')
    terms_accepted = models.BooleanField(default=False, help_text="Customer accepted terms and conditions at order time.")
    amount_paid = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="The amount actually charged at the time of payment. Set by the payment webhook.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.order_reference

    def clean(self):
        has_product = self.product_id is not None
        has_motorcycle = self.motorcycle_id is not None
        if not has_product and not has_motorcycle:
            raise ValidationError("An order must be linked to either a product or a motorcycle.")
        if has_product and has_motorcycle:
            raise ValidationError("An order cannot be linked to both a product and a motorcycle.")

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
