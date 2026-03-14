from django.db import models


class Notification(models.Model):
    NOTIFICATION_TYPE_CHOICES = [
        ('customer_confirmation', 'Customer Confirmation'),
        ('admin_new_order', 'Admin New Order'),
        ('admin_reminder', 'Admin Reminder'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('failed', 'Failed'),
    ]

    order = models.ForeignKey(
        'Order',
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    notification_type = models.CharField(max_length=30, choices=NOTIFICATION_TYPE_CHOICES)
    sent_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')

    def __str__(self):
        return f"{self.notification_type} — {self.order.order_reference} — {self.status}"
