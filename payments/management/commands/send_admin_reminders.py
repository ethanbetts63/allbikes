from django.core.management.base import BaseCommand

from payments.models import Order
from payments.utils.email import send_admin_reminder


class Command(BaseCommand):
    help = 'Sends a daily reminder to admin for every paid but undispatched order.'

    def handle(self, *args, **options):
        orders = Order.objects.filter(status='paid').select_related('product')
        count = orders.count()
        for order in orders:
            send_admin_reminder(order)
        self.stdout.write(f"Done. Processed {count} order(s).")
