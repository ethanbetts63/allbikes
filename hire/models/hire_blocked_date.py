from django.db import models


class HireBlockedDate(models.Model):
    date_from = models.DateField()
    date_to = models.DateField()
    reason = models.CharField(max_length=200, blank=True)
    motorcycle = models.ForeignKey(
        'inventory.Motorcycle',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='blocked_hire_dates',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['date_from']

    def __str__(self):
        label = str(self.motorcycle) if self.motorcycle else 'Global'
        return f"{label}: {self.date_from} – {self.date_to}"
