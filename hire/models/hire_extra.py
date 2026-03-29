from django.db import models


class HireExtra(models.Model):
    name = models.CharField(max_length=100)
    price_per_day = models.DecimalField(max_digits=8, decimal_places=2)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f'{self.name} (${self.price_per_day}/day)'


class HireBookingExtra(models.Model):
    booking = models.ForeignKey(
        'hire.HireBooking',
        on_delete=models.CASCADE,
        related_name='extras',
    )
    extra = models.ForeignKey(
        HireExtra,
        on_delete=models.PROTECT,
        related_name='booking_extras',
    )
    quantity = models.PositiveIntegerField(default=1)
    price_per_day_snapshot = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        help_text='Price per day snapshotted at booking creation time.',
    )
    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text='price_per_day_snapshot × quantity × num_days',
    )

    def __str__(self):
        return f'{self.extra.name} × {self.quantity} ({self.booking.booking_reference})'
