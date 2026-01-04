from django.db import models

class JobType(models.Model):
    """
    Stores supplementary details for job types fetched from MechanicDesk.
    The name should correspond to a job type name from the external API.
    """
    name = models.CharField(
        max_length=255, 
        unique=True,
        help_text="The exact name of the job type from MechanicDesk."
    )
    description = models.TextField(
        blank=True,
        help_text="A customer-facing description of what the service includes."
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Designates whether this job type is active and should be displayed."
    )

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']
