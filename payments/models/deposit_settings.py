from django.db import models


class DepositSettings(models.Model):
    """Singleton model. Only one row should ever exist."""

    deposit_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=550.00,
        help_text="Flat deposit amount charged when a customer reserves a motorcycle (AUD).",
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Deposit Settings"
        verbose_name_plural = "Deposit Settings"

    def __str__(self):
        return f"Deposit Settings (${self.deposit_amount})"

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def get(cls):
        obj, _ = cls.objects.get_or_create(pk=1, defaults={'deposit_amount': '550.00'})
        return obj
