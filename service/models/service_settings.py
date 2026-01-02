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

    def __str__(self):
        return (f"Booking notice: {self.booking_advance_notice} days, "
                f"Drop-off: {self.drop_off_start_time.strftime('%I:%M %p')} - {self.drop_off_end_time.strftime('%I:%M %p')}")


