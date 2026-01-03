from django.db import models

class SiteSettings(models.Model):
    enable_motorcycle_mover = models.BooleanField(
        default=True, help_text="Enable the motorcycle mover section."
    )
    enable_banner = models.BooleanField(
        default=False, help_text="Enable a site-wide announcement banner."
    )
    banner_text = models.CharField(
        max_length=255, blank=True, default="Formerly known as Scootershop Fremantle. Same expert, new location!", help_text="The text to display in the banner."
    )

    phone_number = models.CharField(
        max_length=20, blank=True, null=True, default="94334613", help_text="shop phone"
    )
    email_address = models.EmailField(
        blank=True, null=True, default="admin@scootershop.com.au"
    )
    street_address = models.CharField(
        max_length=255, blank=True, null=True, default="Unit 5 / 6 Cleveland Street"
    )
    address_locality = models.CharField(
        max_length=100, blank=True, null=True, default="Dianella"
    )
    address_region = models.CharField(
        max_length=100, blank=True, null=True, default="WA"
    )
    postal_code = models.CharField(max_length=20, blank=True, null=True, default="6059")

    google_places_place_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Google Places Place ID for the storefront location",
        default="ChIJy_zrHmGhMioRisz6mis0SpQ",
    )
    mrb_number = models.CharField(
        max_length=20, blank=True, null=True, default="MRB5092", help_text="Motor Vehicle Repairer's Business number."
    )
    abn_number = models.CharField(
        max_length=20, blank=True, null=True, default="46157594161", help_text="Australian Business Number."
    )
    md_number = models.CharField(
        max_length=20, blank=True, null=True, default="28276", help_text="Motor Dealer's number."
    )

    youtube_link = models.CharField(max_length=255, blank=True, null=True)
    instagram_link = models.CharField(max_length=255, blank=True, null=True)
    facebook_link = models.CharField(max_length=255, blank=True, null=True)

    opening_hours_monday = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="e.g. '9:00 AM - 5:00 PM' or 'Closed'",
        default="9:00 AM - 5:00 PM",
    )
    opening_hours_tuesday = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="e.g. '9:00 AM - 5:00 PM' or 'Closed'",
        default="9:00 AM - 5:00 PM",
    )
    opening_hours_wednesday = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="e.g. '9:00 AM - 5:00 PM' or 'Closed'",
        default="9:00 AM - 5:00 PM",
    )
    opening_hours_thursday = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="e.g. '9:00 AM - 5:00 PM' or 'Closed'",
        default="9:00 AM - 5:00 PM",
    )
    opening_hours_friday = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="e.g. '9:00 AM - 5:00 PM' or 'Closed'",
        default="9:00 AM - 5:00 PM",
    )
    opening_hours_saturday = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="e.g. '9:00 AM - 5:00 PM' or 'Closed'",
        default="Closed",
    )
    opening_hours_sunday = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="e.g. '9:00 AM - 5:00 PM' or 'Closed'",
        default="Closed",
    )

    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Site Settings"
        verbose_name_plural = "Site Settings"

    def __str__(self):
        return "Site Settings"

    def save(self, *args, **kwargs):
        if not self.pk and SiteSettings.objects.exists():
            # If you are creating a new instance and one already exists
            raise ValueError("There can be only one SiteSettings instance")
        return super(SiteSettings, self).save(*args, **kwargs)

    @classmethod
    def load(cls):
        # Gets the singleton instance, creating it if it doesn't exist
        obj, created = cls.objects.get_or_create(pk=1)
        return obj
