from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from payments.models import Order


class Command(BaseCommand):
    help = 'Cancels orders that have been in pending_payment status for more than 7 days.'

    def handle(self, *args, **options):
        cutoff = timezone.now() - timedelta(days=7)
        updated = Order.objects.filter(
            status='pending_payment',
            created_at__lt=cutoff,
        ).update(status='cancelled')
        self.stdout.write(f"Done. Cancelled {updated} abandoned order(s).")
