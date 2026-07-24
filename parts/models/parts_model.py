from django.db import models


class PartsModel(models.Model):
    """One SYM model book (one source .xls file), keyed by SYM model code."""

    CC_CLASS_CHOICES = [
        ('50', '50cc'),
        ('100_165', '100cc – 165cc'),
        ('200_400', '200cc – 400cc'),
        ('atv', "ATV's"),
    ]

    name = models.CharField(max_length=200, help_text="Display name from the source page, e.g. 'Classic 150'.")
    model_code = models.CharField(max_length=50, unique=True, help_text="SYM model code, e.g. 'AX15W2-6'. The stable key.")
    cc_class = models.CharField(max_length=10, choices=CC_CLASS_CHOICES)
    slug = models.SlugField(max_length=120, unique=True)

    source_xls_url = models.URLField(max_length=500, blank=True)
    source_filename = models.CharField(max_length=255, blank=True)
    book_hash = models.CharField(max_length=64, blank=True, help_text="sha256 of the last-imported .xls, for change detection.")
    last_ingested_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True, help_text="False if the book disappears from the source page.")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['cc_class', 'name']

    def __str__(self):
        return f"{self.name} ({self.model_code})"
