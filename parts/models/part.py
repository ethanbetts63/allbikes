from django.db import models


class Part(models.Model):
    """One unique part number — the pricing/stock join target from the PA feed.

    Colour variants are separate Part rows sharing a ``base_part_number`` and
    differing by ``colour_suffix``. The PA feed field historically called
    ``wholesale_price_incl_gst`` contains RRP+GST; customer price is that value
    plus the configured markup.
    """

    part_number = models.CharField(
        max_length=60, unique=True,
        help_text="Full part number incl. any colour suffix, e.g. '53205-ALA-000-RD'.",
    )
    description = models.CharField(max_length=255, blank=True)

    base_part_number = models.CharField(
        max_length=60, db_index=True, blank=True,
        help_text="Part number without the colour suffix; equals part_number when not colour-keyed.",
    )
    colour_suffix = models.CharField(max_length=10, blank=True, help_text="Colour suffix, e.g. 'RD'.")
    paint_code = models.CharField(max_length=30, blank=True, help_text="Paint code parsed from description, e.g. 'R-010CA'.")
    colour_name = models.CharField(max_length=50, blank=True, help_text="Human colour name, e.g. 'Red'.")

    wholesale_price_incl_gst = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text="RRP including GST from the PA 'RRP+GST' column; null = unknown.",
    )
    available_qty = models.IntegerField(null=True, blank=True, help_text="From PA 'AVAILABLE'; null = not in the PA feed.")
    in_pa_feed = models.BooleanField(default=False, help_text="True if present in the latest PA CSV.")
    price_updated_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['part_number']

    def __str__(self):
        return self.part_number

    @property
    def is_orderable(self):
        return self.in_pa_feed and self.wholesale_price_incl_gst is not None
