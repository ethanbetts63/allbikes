from django.db import models

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
    year = models.IntegerField(null=True, blank=True)
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Sale price (if applicable)",
    )

    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES, blank=True)

    conditions = models.ManyToManyField(
        "inventory.MotorcycleCondition",
        related_name="motorcycles",
        blank=True,
        help_text="Select all applicable conditions (e.g., Used, New, Demo.)",
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="for_sale",
        help_text="The sales status of the motorcycle.",
    )
    odometer = models.IntegerField(default=0)
    engine_size = models.IntegerField(null=True, blank=True, help_text="Engine size in cubic centimeters (cc)")
    range = models.IntegerField(null=True, blank=True, help_text="Range in kilometers (if applicable)")

    seats = models.IntegerField(
        help_text="Number of seats on the motorcycle", null=True, blank=True
    )

    transmission = models.CharField(
        max_length=20,
        choices=TRANSMISSION_CHOICES,
        help_text="Motorcycle transmission type",
        null=True,
        blank=True,
    )

    description = models.TextField(null=True, blank=True)

    youtube_link = models.URLField(
        max_length=255,
        blank=True,
        null=True,
        help_text="An optional link to a YouTube video for this motorcycle.",
    )
    date_posted = models.DateTimeField(auto_now_add=True)

    rego = models.CharField(
        max_length=20, help_text="Registration number", null=True, blank=True
    )
    rego_exp = models.DateField(
        help_text="Registration expiration date", null=True, blank=True
    )
    stock_number = models.CharField(max_length=50, unique=True, null=True, blank=True)

    warranty_months = models.IntegerField(
        null=True, blank=True, help_text="Number of months the warranty is valid for"
    )


    def __str__(self):
        return f"{self.year} {self.brand} {self.model}"
