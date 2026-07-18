from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from notifications.utils.email import send_service_reminder
from service.models import Booking, ServiceSettings


class Command(BaseCommand):
    help = (
        "Sends customer reminder emails for bookings due reminder_days_before "
        "from now. Gated on ServiceSettings.reminder_emails_enabled. Intended "
        "to run daily."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Send even if reminder_emails_enabled is off.',
        )

    def handle(self, *args, **options):
        settings = ServiceSettings.load()

        if not settings.reminder_emails_enabled and not options['force']:
            self.stdout.write("Reminder emails are disabled — skipping. Use --force to override.")
            return

        target_date = timezone.localdate() + timedelta(days=settings.reminder_days_before)

        # Only remind for jobs still on the books (not finished), not already reminded.
        bookings = Booking.objects.filter(
            drop_off_date=target_date,
            reminder_sent_at__isnull=True,
        ).exclude(status=Booking.Status.FINISHED_PAID)

        if not bookings:
            self.stdout.write(f"No bookings needing a reminder for {target_date}.")
            return

        sent_count = 0
        failed_count = 0
        for booking in bookings:
            if send_service_reminder(booking):
                booking.reminder_sent_at = timezone.now()
                booking.save(update_fields=['reminder_sent_at'])
                sent_count += 1
            else:
                failed_count += 1

        if sent_count:
            self.stdout.write(self.style.SUCCESS(f"Sent {sent_count} reminder(s) for {target_date}."))
        if failed_count:
            self.stderr.write(self.style.ERROR(f"Failed to send {failed_count} reminder(s)."))
