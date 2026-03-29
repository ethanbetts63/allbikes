from django.db import models


class HireSettings(models.Model):
    """Singleton model. Only one row should ever exist."""

    bond_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        help_text="Flat bond amount charged alongside the hire fee (AUD).",
    )
    advance_min_days = models.IntegerField(
        default=1,
        help_text="Minimum number of days in advance a hire booking can start.",
    )
    advance_max_days = models.IntegerField(
        default=90,
        help_text="Maximum number of days in advance a hire booking can start.",
    )
    minimum_age = models.IntegerField(
        default=21,
        help_text="Minimum age required to hire a motorcycle (displayed in the booking form).",
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Hire Settings"
        verbose_name_plural = "Hire Settings"

    def __str__(self):
        return f"Hire Settings (bond: ${self.bond_amount})"

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def get(cls):
        obj, _ = cls.objects.get_or_create(pk=1, defaults={'bond_amount': '0.00'})
        return obj
