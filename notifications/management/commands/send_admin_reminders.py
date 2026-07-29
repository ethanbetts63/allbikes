from django.core.management.base import BaseCommand
from django.template.loader import render_to_string
from django.utils import timezone

from inventory.models import BikeOrder
from notifications.utils.email import _admin_recipients, _record, _send_mailgun
from product.models import ProductOrder


class Command(BaseCommand):
    help = 'Sends a weekly admin summary of paid product and bike orders.'

    def add_arguments(self, parser):
        parser.add_argument('--force', action='store_true')

    def handle(self, *args, **options):
        today = timezone.localtime(timezone.now())
        if not options['force'] and today.weekday() != 0:
            self.stdout.write('Not Monday — skipping. Use --force to override.')
            return
        recipients = _admin_recipients()
        if not recipients:
            self.stderr.write(self.style.ERROR('No admin emails are configured.'))
            return
        product_orders = list(ProductOrder.objects.filter(status='paid').select_related('product'))
        bike_orders = list(BikeOrder.objects.filter(status='paid').select_related('motorcycle'))
        if not product_orders and not bike_orders:
            self.stdout.write('No paid orders — nothing to send.')
            return
        date_str = today.strftime('%d %b %Y')
        subject = f'Weekly order summary — {date_str}'
        rows = [
            *[{'kind': 'Product', 'reference': o.order_reference, 'item': o.product.name,
               'customer': o.customer_name, 'created_at': o.created_at} for o in product_orders],
            *[{'kind': 'Bike deposit', 'reference': o.order_reference, 'item': str(o.motorcycle),
               'customer': o.customer_name, 'created_at': o.created_at} for o in bike_orders],
        ]
        html_body = render_to_string(
            'notifications/emails/admin_weekly_summary.html',
            {'order_rows': rows, 'date_str': date_str},
        )
        text_lines = [f'Weekly Order Summary — {date_str}', '']
        for row in rows:
            text_lines.append(
                f"[{row['kind']}] {row['reference']} | {row['item']} | {row['customer']}"
            )
        text_body = '\n'.join(text_lines)
        for to in recipients:
            try:
                _send_mailgun(to=to, subject=subject, html_body=html_body, text_body=text_body)
                _record(None, 'admin_weekly_summary', to, subject, text_body, html_body, 'sent')
                self.stdout.write(self.style.SUCCESS(f'Sent weekly summary to {to}.'))
            except Exception as exc:
                _record(None, 'admin_weekly_summary', to, subject, text_body, html_body, 'failed', str(exc))
                self.stderr.write(self.style.ERROR(f'Failed to send to {to}: {exc}'))
