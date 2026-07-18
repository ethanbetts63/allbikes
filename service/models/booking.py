from django.db import models


class Booking(models.Model):
    """
    A service booking shown on the workshop diary.

    This is our own record of a job. Website submissions are still forwarded to
    MechanicDesk (see BookingViewSet.create) — a Booking is created alongside
    that request as `requested`, and staff can also add bookings manually.
    Customer and vehicle details are stored as freeform fields on the booking
    itself; there are no separate Customer/Bike records.
    """

    class Status(models.TextChoices):
        REQUESTED = 'requested', 'Requested'          # submitted online, awaiting confirmation
        NOT_STARTED = 'not_started', 'Not started'    # confirmed, not yet worked on
        IN_PROGRESS = 'in_progress', 'In progress'
        FINISHED_PAID = 'finished_paid', 'Finished & paid'

    class Source(models.TextChoices):
        WEBSITE = 'website', 'Website'
        MANUAL = 'manual', 'Manually added'
        IMPORTED = 'imported', 'Imported (MechanicDesk)'

    # Scheduling — start (drop-off) time only; no end time / duration is tracked.
    drop_off_date = models.DateField(help_text="The day this job sits on in the diary.")
    drop_off_time = models.TimeField(null=True, blank=True, help_text="Drop-off/start time. Optional.")

    # Customer (freeform)
    customer_name = models.CharField(max_length=255)
    customer_phone = models.CharField(max_length=30, blank=True)
    customer_email = models.EmailField(blank=True)

    # Customer address (optional)
    street_address = models.CharField(max_length=255, blank=True)
    suburb = models.CharField(max_length=100, blank=True)
    postcode = models.CharField(max_length=10, blank=True)

    # Vehicle (freeform)
    registration = models.CharField(max_length=20, blank=True)
    make = models.CharField(max_length=100, blank=True)
    model = models.CharField(max_length=100, blank=True)
    year = models.CharField(max_length=10, blank=True)
    odometer = models.CharField(max_length=20, blank=True)

    # Job
    job_description = models.TextField(blank=True, help_text="What the job involves.")

    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.NOT_STARTED
    )
    source = models.CharField(
        max_length=10, choices=Source.choices, default=Source.MANUAL
    )

    # MechanicDesk Job Number, set only on imported bookings. Used to make the
    # CSV import idempotent (re-running never duplicates a job).
    md_job_number = models.CharField(max_length=50, blank=True, db_index=True)

    # Link back to the MechanicDesk request this booking came from, if any.
    booking_log = models.ForeignKey(
        'service.BookingRequestLog',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='bookings',
    )

    reminder_sent_at = models.DateTimeField(
        null=True, blank=True, help_text="When the reminder email was sent, if at all."
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # Diary reads a day's column top-to-bottom in time order; jobs with no
        # time fall to the bottom (nulls_last is emulated on SQLite by Django).
        ordering = [
            'drop_off_date',
            models.F('drop_off_time').asc(nulls_last=True),
            'created_at',
        ]

    @property
    def vehicle_label(self):
        """Composed vehicle name for display, e.g. '2016 Vespa GTS 300'."""
        return ' '.join(part for part in [self.year, self.make, self.model] if part).strip()

    def __str__(self):
        return f"{self.customer_name} — {self.vehicle_label or 'vehicle'} on {self.drop_off_date}"
