import secrets
from django.db import models


class HireBooking(models.Model):
    STATUS_CHOICES = [
        ('pending_payment', 'Pending Payment'),
        ('confirmed', 'Confirmed'),
        ('active', 'Active'),
        ('returned', 'Returned'),
        ('cancelled', 'Cancelled'),
    ]

    motorcycle = models.ForeignKey(
        'inventory.Motorcycle',
        on_delete=models.PROTECT,
        related_name='hire_bookings',
    )
    booking_reference = models.CharField(max_length=20, unique=True, blank=True)
    hire_start = models.DateField()
    hire_end = models.DateField()
    effective_daily_rate = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Daily rate snapshotted at booking creation time.",
    )
    total_hire_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Total hire charge (effective_daily_rate * number of days).",
    )
    bond_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Bond amount snapshotted from HireSettings at booking creation time.",
    )
    customer_name = models.CharField(max_length=200)
    customer_email = models.EmailField()
    customer_phone = models.CharField(max_length=50)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending_payment')
    terms_accepted = models.BooleanField(default=False, help_text="Customer accepted hire terms and conditions at booking time.")
    notes = models.TextField(blank=True, help_text="Internal admin notes.")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.booking_reference

    def save(self, *args, **kwargs):
        if not self.booking_reference:
            self.booking_reference = _generate_reference()
        super().save(*args, **kwargs)


def _generate_reference():
    while True:
        token = secrets.token_hex(4).upper()
        ref = f'HR-{token}'
        if not HireBooking.objects.filter(booking_reference=ref).exists():
            return ref
