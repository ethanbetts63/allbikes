from django.db import models

from parts.pricing import gross_profit_ex_gst, profit_margin_percentage


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
    rrp_unit_price_incl_gst = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text="RRP+GST from the supplier feed at checkout.",
    )
    supplier_discount_percentage = models.DecimalField(
        max_digits=6, decimal_places=2, null=True, blank=True,
        help_text="Configured supplier discount snapshotted at checkout.",
    )
    supplier_unit_cost_incl_gst = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text="Actual discounted unit cost including GST at checkout.",
    )
    markup_percentage = models.DecimalField(
        max_digits=6, decimal_places=2, null=True, blank=True,
        help_text="Parts Settings markup snapshotted at checkout.",
    )
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Customer price incl. GST (marked up).")
    line_total = models.DecimalField(max_digits=10, decimal_places=2)

    # `backordered` = on hold awaiting stock; `status` = the line's own outcome.
    # There is no stored `completed` — a line counts as completed when its order
    # is completed and it was not refunded. That is derived in the serializer.
    STATUS_CHOICES = [
        ('to_order', 'To Order'),
        ('refunded', 'Refunded'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='to_order')
    backordered = models.BooleanField(default=False, help_text="Understocked at order time / placed on backorder by admin.")

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f"{self.part_number} x{self.quantity}"

    @property
    def rrp_line_total_incl_gst(self):
        if self.rrp_unit_price_incl_gst is None:
            return None
        return self.rrp_unit_price_incl_gst * self.quantity

    @property
    def supplier_line_total_incl_gst(self):
        if self.supplier_unit_cost_incl_gst is None:
            return None
        return self.supplier_unit_cost_incl_gst * self.quantity

    @property
    def gross_profit_ex_gst(self):
        cost = self.supplier_line_total_incl_gst
        if cost is None:
            return None
        return gross_profit_ex_gst(self.line_total, cost)

    @property
    def profit_margin_percentage(self):
        cost = self.supplier_line_total_incl_gst
        if cost is None:
            return None
        return profit_margin_percentage(self.line_total, cost)
