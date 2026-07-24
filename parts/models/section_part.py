from django.db import models


class SectionPart(models.Model):
    """One callout line in a section's parts table.

    Multiple rows may share a ``ref_number`` (the number printed on the diagram)
    when a callout has year/effective-date or colour variants; each row points at
    a distinct :class:`~parts.models.Part`.
    """

    section = models.ForeignKey(
        'parts.PartSection',
        on_delete=models.CASCADE,
        related_name='parts',
    )
    part = models.ForeignKey(
        'parts.Part',
        on_delete=models.PROTECT,
        related_name='section_parts',
    )
    ref_number = models.CharField(max_length=20, help_text="Callout number as printed on the diagram, e.g. '2', '2-1'.")
    description = models.CharField(max_length=255, blank=True, help_text="Description as printed in this book.")
    quantity = models.PositiveIntegerField(default=1)
    effective_date = models.DateField(null=True, blank=True, help_text="Running-change date, parsed from the book's Excel serial.")
    superseded_flag = models.CharField(max_length=5, blank=True, help_text="The book's Y/N supersession flag.")
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['section', 'sort_order']

    def __str__(self):
        return f"{self.section.code} #{self.ref_number} — {self.part.part_number}"
