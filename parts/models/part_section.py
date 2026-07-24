from django.db import models


class PartSection(models.Model):
    """One E/F section sheet from a book: an exploded diagram + its parts table."""

    GROUP_CHOICES = [
        ('engine', 'Engine'),
        ('frame', 'Frame'),
    ]

    parts_model = models.ForeignKey(
        'parts.PartsModel',
        on_delete=models.CASCADE,
        related_name='sections',
    )
    code = models.CharField(max_length=10, help_text="Section code, e.g. 'E01', 'F14'.")
    group = models.CharField(max_length=10, choices=GROUP_CHOICES)
    name = models.CharField(max_length=200, help_text="Section name, e.g. 'Shroud Assy'.")
    diagram_image = models.ImageField(upload_to='parts/diagrams/', null=True, blank=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['parts_model', 'sort_order', 'code']
        unique_together = [('parts_model', 'code')]

    def __str__(self):
        return f"{self.parts_model.model_code} {self.code} — {self.name}"
