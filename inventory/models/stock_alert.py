import uuid

from django.db import models
from django.utils import timezone


class StockAlertSubscriber(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('unsubscribed', 'Unsubscribed'),
        ('bounced', 'Bounced'),
        ('complained', 'Complained'),
    ]

    email = models.EmailField(unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    unsubscribe_token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    consent_version = models.CharField(max_length=30, default='scooter-stock-v1')
    subscribed_at = models.DateTimeField(default=timezone.now)
    unsubscribed_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-subscribed_at']

    def save(self, *args, **kwargs):
        self.email = (self.email or '').strip().casefold()
        super().save(*args, **kwargs)

    def unsubscribe(self, *, status='unsubscribed'):
        self.status = status
        self.unsubscribed_at = timezone.now()
        self.save(update_fields=['status', 'unsubscribed_at', 'updated_at'])

    def __str__(self):
        return self.email

