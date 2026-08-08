from django.db import models


class BikeInterestEnquiry(models.Model):
    """A customer asking to be contacted about one specific bike.

    Deliberately email-only. This sits where the deposit button would be for
    buyers who aren't ready to pay, so any extra field is friction that defeats
    the point. Everything else is gathered in the reply conversation.
    """

    motorcycle = models.ForeignKey(
        'inventory.Motorcycle',
        on_delete=models.CASCADE,
        related_name='interest_enquiries',
    )
    email = models.EmailField()
    created_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        # One open enquiry per person per bike. Re-submitting the form is a
        # no-op rather than another row for staff to work through.
        constraints = [
            models.UniqueConstraint(
                fields=['motorcycle', 'email'],
                name='unique_interest_per_bike_and_email',
            ),
        ]

    @property
    def responded(self):
        return self.responded_at is not None

    def save(self, *args, **kwargs):
        self.email = (self.email or '').strip().casefold()
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.email} — {self.motorcycle}'
