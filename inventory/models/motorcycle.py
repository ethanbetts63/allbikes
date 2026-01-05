from django.db import models
from django.utils.text import slugify

class Motorcycle(models.Model):
    STATUS_CHOICES = [
        ("for_sale", "For Sale"),
        ("sold", "Sold"),
        ("reserved", "Reserved"),
        ("unavailable", "Unavailable"),
    ]

    CONDITION_CHOICES = [
        ("new", "New"),
        ("used", "Used"),
        ("demo", "Demo"),
    ]

    TRANSMISSION_CHOICES = [
        ("automatic", "Automatic"),
        ("manual", "Manual"),
        ("semi-auto", "Semi-Automatic"),
    ]

    make = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    year = models.IntegerField(
        null=True,
        blank=True,
    )
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Sale price (if applicable)",
    )

    slug = models.SlugField(
        max_length=255, 
        unique=True, 
        blank=True, 
        null=True
    )

    condition = models.CharField(
        max_length=20,
        choices=CONDITION_CHOICES,
        blank=True,
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="for_sale",
        help_text="The sales status of the motorcycle.",
    )
    is_featured = models.BooleanField(
        null=True,
        default=True,
        help_text="Featured bikes are shown on the homepage.",
    )
    odometer = models.IntegerField(default=0)
    engine_size = models.IntegerField(
        null=True,
        blank=True,
        help_text="Engine size in cubic centimeters (cc)",
    )
    range = models.IntegerField(
        null=True,
        blank=True,
        help_text="Range in kilometers (if applicable)",
    )

    seats = models.IntegerField(
        null=True,
        blank=True,
        help_text="Number of seats on the motorcycle",
    )

    transmission = models.CharField(
        max_length=20,
        choices=TRANSMISSION_CHOICES,
        null=True,
        blank=True,
        help_text="Motorcycle transmission type",
    )

    description = models.TextField(
        null=True,
        blank=True,
    )

    youtube_link = models.URLField(
        max_length=255,
        blank=True,
        null=True,
        help_text="An optional link to a YouTube video for this motorcycle.",
    )
    date_posted = models.DateTimeField(auto_now_add=True)

    rego = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        help_text="Registration number",
    )
    rego_exp = models.DateField(
        null=True,
        blank=True,
        help_text="Registration expiration date",
    )
    stock_number = models.CharField(
        max_length=50,
        unique=True,
        null=True,
        blank=True,
    )

    warranty_months = models.IntegerField(
        null=True,
        blank=True,
        help_text="Number of months the warranty is valid for",
    )

    def __str__(self):
        name = f"{self.year} {self.make} {self.model}" if self.year else f"{self.make} {self.model}"
        return name.strip()

    def save(self, *args, **kwargs):

        super().save(*args, **kwargs)
        expected_slug = slugify(f"{self.year or 'bike'}-{self.make}-{self.model}-{self.id}")
        
        if self.slug != expected_slug:
            Motorcycle.objects.filter(pk=self.pk).update(slug=expected_slug)
            self.slug = expected_slug
