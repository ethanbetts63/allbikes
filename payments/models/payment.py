from django.db import models
from django.db.models import Q


class Payment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('succeeded', 'Succeeded'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]

    product_order = models.ForeignKey(
        'product.ProductOrder', null=True, blank=True,
        on_delete=models.CASCADE, related_name='payments',
    )
    bike_order = models.ForeignKey(
        'inventory.BikeOrder', null=True, blank=True,
        on_delete=models.CASCADE, related_name='payments',
    )
    hire_booking = models.ForeignKey(
        'hire.HireBooking', null=True, blank=True, on_delete=models.CASCADE, related_name='payments'
    )
    parts_order = models.ForeignKey(
        'parts.PartsOrder', null=True, blank=True, on_delete=models.CASCADE, related_name='payments'
    )
    stripe_payment_intent_id = models.CharField(max_length=255, unique=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=(
                    Q(product_order__isnull=False, bike_order__isnull=True, hire_booking__isnull=True, parts_order__isnull=True)
                    | Q(product_order__isnull=True, bike_order__isnull=False, hire_booking__isnull=True, parts_order__isnull=True)
                    | Q(product_order__isnull=True, bike_order__isnull=True, hire_booking__isnull=False, parts_order__isnull=True)
                    | Q(product_order__isnull=True, bike_order__isnull=True, hire_booking__isnull=True, parts_order__isnull=False)
                ),
                name='payment_exactly_one_target',
            ),
        ]

    def __str__(self):
        return f"Payment {self.stripe_payment_intent_id} — {self.status}"
