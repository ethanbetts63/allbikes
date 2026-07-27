from decimal import ROUND_HALF_UP, Decimal

from django.db import models


class PartsSettings(models.Model):
    """Singleton operator settings for the parts store. Only one row ever exists."""

    markup_percentage = models.DecimalField(
        max_digits=6, decimal_places=2, default=Decimal('20.00'),
        help_text="Percent added to the wholesale price to get the customer price, e.g. 20.00 = +20%.",
    )
    domestic_shipping_fee = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal('15.00'),
        help_text="Flat shipping fee (AUD) for Australian destinations.",
    )
    international_shipping_fee = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal('50.00'),
        help_text="Flat shipping fee (AUD) for non-Australian destinations.",
    )
    enable_new_part_sales = models.BooleanField(
        default=True,
        help_text="Allow customers to add genuine new SYM parts to their cart and checkout.",
    )
    backorder_hold_days = models.PositiveIntegerField(
        default=7,
        help_text="Days an order can wait for a backordered part before the operator refunds it.",
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Parts Settings"
        verbose_name_plural = "Parts Settings"

    def __str__(self):
        return f"Parts Settings (markup {self.markup_percentage}%)"

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def get(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def apply_markup(self, wholesale_price):
        """Wholesale price with markup applied, rounded to 2dp. None if price is None."""
        if wholesale_price is None:
            return None
        factor = Decimal(1) + (self.markup_percentage / Decimal(100))
        return (wholesale_price * factor).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

    def shipping_fee(self, is_international):
        return self.international_shipping_fee if is_international else self.domestic_shipping_fee
