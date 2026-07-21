from django.db import models


class BlockedDate(models.Model):
    """
    A one-off calendar-day override for service bookings.

    Used only when ServiceSettings.use_mechanic_desk_blocked_dates is False.
    Recurring rules (weekdays always closed, minimum advance notice) live on
    ServiceSettings; this model is the per-day exceptions staff toggle by
    clicking a day in the diary.

    An override goes in either direction:
      - available=False (default): force the day closed, even if the rules
        would otherwise allow it.
      - available=True: force the day OPEN, overriding the recurring rules
        (advance-notice window, always-closed weekdays). Lets an admin make
        an exception and take a booking on a day that would normally be greyed.
    """

    date = models.DateField(unique=True)
    available = models.BooleanField(
        default=False,
        help_text="When True this is a force-open override that beats the "
                  "recurring rules; when False the day is force-closed.",
    )
    reason = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['date']

    def __str__(self):
        kind = "Open override" if self.available else "Blocked"
        return f"{kind}: {self.date}"
