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


class StockAlertCampaign(models.Model):
    STATUS_CHOICES = [
        ('sending', 'Sending'),
        ('sent', 'Sent'),
        ('partial', 'Partially sent'),
        ('failed', 'Failed'),
    ]

    subject = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='sending')
    recipient_count = models.PositiveIntegerField(default=0)
    sent_count = models.PositiveIntegerField(default=0)
    failed_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.subject


class StockAlertCampaignItem(models.Model):
    campaign = models.ForeignKey(StockAlertCampaign, on_delete=models.CASCADE, related_name='items')
    motorcycle = models.ForeignKey('inventory.Motorcycle', on_delete=models.SET_NULL, null=True, blank=True, related_name='stock_alert_items')
    position = models.PositiveIntegerField(default=0)
    title = models.CharField(max_length=255)
    listing_url = models.URLField(max_length=500)
    image_url = models.URLField(max_length=1000, blank=True)
    price_label = models.CharField(max_length=80, blank=True)
    details = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ['position', 'id']
        constraints = [
            models.UniqueConstraint(fields=['campaign', 'motorcycle'], name='unique_stock_alert_campaign_bike'),
        ]

    @property
    def deposit_url(self):
        """The current checkout deposit link for this immutable listing URL."""
        slug = self.listing_url.rstrip('/').rsplit('/', 1)[-1]
        return f'https://www.scootershop.com.au/checkout/{slug}?type=deposit'


class StockAlertCampaignRecipient(models.Model):
    STATUS_CHOICES = [
        ('queued', 'Queued'),
        ('sent', 'Sent'),
        ('failed', 'Failed'),
        ('delivered', 'Delivered'),
        ('bounced', 'Bounced'),
        ('unsubscribed', 'Unsubscribed'),
        ('complained', 'Complained'),
    ]

    campaign = models.ForeignKey(StockAlertCampaign, on_delete=models.CASCADE, related_name='recipients')
    subscriber = models.ForeignKey(StockAlertSubscriber, on_delete=models.SET_NULL, null=True, blank=True, related_name='campaign_recipients')
    email = models.EmailField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='queued')
    message = models.OneToOneField('notifications.Message', on_delete=models.SET_NULL, null=True, blank=True, related_name='stock_alert_recipient')
    error_message = models.TextField(blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['id']
        constraints = [
            models.UniqueConstraint(fields=['campaign', 'email'], name='unique_stock_alert_campaign_recipient'),
        ]
