from django.db import models

class BookingRequestLog(models.Model):
    """
    A model to log requests made from our system to the Mechanics Desk API.
    This is for auditing and debugging purposes.
    """
    customer_name = models.CharField(max_length=255, help_text="Customer's full name")
    customer_email = models.EmailField(help_text="Customer's email address")
    vehicle_registration = models.CharField(max_length=20, blank=True, null=True, help_text="Vehicle registration number")
    
    request_payload = models.JSONField(help_text="The exact JSON payload sent to Mechanics Desk.")
    response_status_code = models.PositiveIntegerField(help_text="The HTTP status code from the Mechanics Desk API response.")
    response_body = models.JSONField(help_text="The JSON response from the Mechanics Desk API.")
    
    created_at = models.DateTimeField(auto_now_add=True, help_text="When the request was made.")
    status = models.CharField(max_length=20, choices=[('Success', 'Success'), ('Failed', 'Failed')], help_text="The status of the request.")

    def __str__(self):
        return f"Booking request for {self.customer_name} at {self.created_at.strftime('%Y-%m-%d %H:%M')}"

    class Meta:
        verbose_name = "Booking Request Log"
        verbose_name_plural = "Booking Request Logs"
        ordering = ['-created_at']
