from django.db import models
from django.utils import timezone


TERM_TYPE_CHOICES = [
    ('hire', 'Hire'),
    ('service', 'Service'),
    ('purchase', 'Purchase'),
]


class TermsAndConditions(models.Model):
    """
    Represents the current Terms and Conditions for a given context (hire, service, purchase).
    One record per term_type — updated in place when terms change.
    """
    term_type = models.CharField(
        max_length=20,
        choices=TERM_TYPE_CHOICES,
        unique=True,
        default='purchase',
        help_text="The type of terms (hire, service, purchase).",
    )
    content = models.TextField(help_text="The full HTML content of the terms and conditions.")
    published_at = models.DateTimeField(default=timezone.now, help_text="The date and time these terms were last published.")

    class Meta:
        verbose_name_plural = "Terms and Conditions"
        ordering = ['-published_at']

    def __str__(self):
        return f"Terms and Conditions — {self.get_term_type_display()}"
