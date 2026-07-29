from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from hire.models import HireBooking
from inventory.models import BikeOrder
from parts.models import PartsOrder
from product.models import ProductOrder


class Command(BaseCommand):
    help = 'Cancels orders and hire bookings pending payment for more than 7 days.'

    def handle(self, *args, **options):
        cutoff = timezone.now() - timedelta(days=7)
        targets = (ProductOrder, BikeOrder, HireBooking, PartsOrder)
        counts = [
            model.objects.filter(status='pending_payment', created_at__lt=cutoff).update(status='cancelled')
            for model in targets
        ]
        self.stdout.write(
            'Done. Cancelled '
            f'{counts[0]} product order(s), {counts[1]} bike order(s), '
            f'{counts[2]} hire booking(s), and {counts[3]} parts order(s).'
        )
