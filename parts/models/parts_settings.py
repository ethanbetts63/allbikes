from decimal import Decimal

from django.db import models

from parts.pricing import customer_unit_price


class PartsSettings(models.Model):
    """Singleton operator settings for the parts store. Only one row ever exists."""

    markup_percentage = models.DecimalField(
        max_digits=6, decimal_places=2, default=Decimal('20.00'),
        help_text="Percent added to the wholesale price to get the customer price, e.g. 20.00 = +20%.",
    )
    shipping_fee = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal('15.00'),
        help_text="Flat shipping fee (AUD) for Australian delivery addresses.",
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
        return customer_unit_price(wholesale_price, self.markup_percentage)
