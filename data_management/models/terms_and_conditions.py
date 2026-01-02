from django.db import models
from django.utils import timezone

class TermsAndConditions(models.Model):
    """
    Represents a version of the Terms and Conditions.
    """
    version = models.CharField(max_length=20, unique=True, help_text="Version number, e.g., '1.0'")
    content = models.TextField(help_text="The full HTML content of the terms and conditions.")
    published_at = models.DateTimeField(default=timezone.now, help_text="The date and time this version was published.")

    class Meta:
        verbose_name_plural = "Terms and Conditions"
        ordering = ['-published_at']

    def __str__(self):
        return f"Terms and Conditions v{self.version}"
