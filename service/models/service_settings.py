from django.db import models
from datetime import time


class ServiceSettings(models.Model):
    booking_advance_notice = models.IntegerField(
        default=2,
        help_text="Minimum number of days notice required for a booking (e.g., 1 for next day).",
    )

    drop_off_start_time = models.TimeField(
        default=time(9, 0),
        help_text="The earliest time customers can drop off their motorcycle.",
    )
    drop_off_end_time = models.TimeField(
        default=time(17, 0),
        help_text="The latest time customers can drop off their motorcycle.",
    )

    def __str__(self):
        return "Service Settings"

    class Meta:
        verbose_name = "Service Settings"
        verbose_name_plural = "Service Settings"

    def save(self, *args, **kwargs):
        if not self.pk and ServiceSettings.objects.exists():
            # If you are creating a new instance and one already exists
            raise ValueError("There can be only one ServiceSettings instance")
        return super(ServiceSettings, self).save(*args, **kwargs)

    @classmethod
    def load(cls):
        # Gets the singleton instance, creating it if it doesn't exist
        obj, created = cls.objects.get_or_create(pk=1)
        return obj


