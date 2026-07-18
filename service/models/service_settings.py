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

    # --- Blocked-day source (temporary, during MechanicDesk dual-write) ---
    use_mechanic_desk_blocked_dates = models.BooleanField(
        default=True,
        help_text="When on, unavailable days are read from MechanicDesk. When off, "
                  "they are computed from our own rules and blocked dates below.",
    )
    always_blocked_weekdays = models.CharField(
        max_length=20,
        blank=True,
        default='',
        help_text="Comma-separated weekday numbers always closed (Mon=0 … Sun=6), e.g. '6' for Sundays.",
    )

    # --- Reminder emails ---
    reminder_emails_enabled = models.BooleanField(
        default=False,
        help_text="When on, our own reminder emails are sent (in addition to MechanicDesk's, "
                  "until MechanicDesk is retired). Toggle off to avoid duplicate reminders.",
    )
    reminder_days_before = models.IntegerField(
        default=1,
        help_text="How many days before drop-off the reminder email is sent.",
    )

    def get_always_blocked_weekdays(self):
        """Parse always_blocked_weekdays into a set of ints (0=Mon … 6=Sun)."""
        result = set()
        for part in (self.always_blocked_weekdays or '').split(','):
            part = part.strip()
            if part.isdigit():
                result.add(int(part))
        return result

    def __str__(self):
        return "Service Settings"

    class Meta:
        verbose_name = "Service Settings"
        verbose_name_plural = "Service Settings"

    def save(self, *args, **kwargs):
        if ServiceSettings.objects.exists() and self.pk != ServiceSettings.objects.first().pk:
            raise ValueError("There can be only one ServiceSettings instance")
        return super(ServiceSettings, self).save(*args, **kwargs)

    @classmethod
    def load(cls):
        # Gets the singleton instance, creating it if it doesn't exist
        obj, created = cls.objects.get_or_create(pk=1)
        return obj


