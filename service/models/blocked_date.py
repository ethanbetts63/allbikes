from django.db import models


class BlockedDate(models.Model):
    """
    A specific calendar day blocked off for service bookings.

    Used only when ServiceSettings.use_mechanic_desk_blocked_dates is False.
    Recurring rules (weekdays always closed, minimum advance notice) live on
    ServiceSettings; this model is just the one-off exceptions staff toggle by
    clicking a day in the diary.
    """

    date = models.DateField(unique=True)
    reason = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['date']

    def __str__(self):
        return f"Blocked: {self.date}"
