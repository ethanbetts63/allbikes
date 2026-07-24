from django.db import models


class PartsOrderItem(models.Model):
    """One line in a PartsOrder. Fields are snapshots so catalog re-imports never
    mutate a placed order."""

    parts_order = models.ForeignKey(
        'parts.PartsOrder',
        on_delete=models.CASCADE,
        related_name='items',
    )
    part_number = models.CharField(max_length=60, help_text="Snapshot, incl. any colour suffix.")
    description = models.CharField(max_length=255, blank=True)
    colour_name = models.CharField(max_length=50, blank=True)
    model_name = models.CharField(max_length=200, blank=True)
    model_code = models.CharField(max_length=50, blank=True)
    section_code = models.CharField(max_length=10, blank=True)
    ref_number = models.CharField(max_length=20, blank=True)

    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Customer price incl. GST (marked up).")
    line_total = models.DecimalField(max_digits=10, decimal_places=2)

    backordered = models.BooleanField(default=False, help_text="Understocked at order time / placed on backorder by admin.")
    backorder_since = models.DateField(null=True, blank=True, help_text="Start of the 14-day hold clock.")

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f"{self.part_number} x{self.quantity}"
