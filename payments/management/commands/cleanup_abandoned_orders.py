from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from hire.models import HireBooking
from payments.models import Order


class Command(BaseCommand):
    help = 'Cancels orders and hire bookings that have been in pending_payment status for more than 7 days.'

    def handle(self, *args, **options):
        cutoff = timezone.now() - timedelta(days=7)

        cancelled_orders = Order.objects.filter(
            status='pending_payment',
            created_at__lt=cutoff,
        ).update(status='cancelled')

        cancelled_bookings = HireBooking.objects.filter(
            status='pending_payment',
            created_at__lt=cutoff,
        ).update(status='cancelled')

        self.stdout.write(
            f"Done. Cancelled {cancelled_orders} abandoned order(s) and "
            f"{cancelled_bookings} abandoned hire booking(s)."
        )
