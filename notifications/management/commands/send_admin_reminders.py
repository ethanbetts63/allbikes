from django.conf import settings
from django.core.management.base import BaseCommand
from django.template.loader import render_to_string
from django.utils import timezone

from notifications.utils.email import _send_mailgun, _record
from payments.models import Order


class Command(BaseCommand):
    help = 'Sends a weekly admin summary of paid (unactioned) orders. Runs only on Mondays.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Send the email regardless of what day it is.',
        )

    def handle(self, *args, **options):
        today = timezone.localtime(timezone.now())
        if not options['force'] and today.weekday() != 0:
            self.stdout.write("Not Monday — skipping. Use --force to override.")
            return

        admin_email = getattr(settings, 'ADMIN_EMAIL', None)
        if not admin_email:
            self.stderr.write(self.style.ERROR("ADMIN_EMAIL is not configured."))
            return

        paid_orders = list(
            Order.objects
            .filter(status='paid')
            .select_related('product', 'motorcycle')
            .order_by('created_at')
        )

        if not paid_orders:
            self.stdout.write("No paid orders — nothing to send.")
            return

        date_str = today.strftime('%d %b %Y')
        subject = f"Weekly order summary — {date_str}"

        context = {
            'paid_orders': paid_orders,
            'date_str': date_str,
        }
        html_body = render_to_string('notifications/emails/admin_weekly_summary.html', context)

        text_lines = [f"Weekly Order Summary — {date_str}\n"]
        text_lines.append(f"PAID — awaiting action ({len(paid_orders)})")
        for o in paid_orders:
            item_name = o.motorcycle.__str__() if o.motorcycle else o.product.name
            order_type = "Deposit" if o.payment_type == 'deposit' else "Order"
            text_lines.append(
                f"  [{order_type}] {o.order_reference}  |  {item_name}  |  {o.customer_name}  |  Placed: {timezone.localtime(o.created_at).strftime('%d %b %Y')}"
            )
        text_body = "\n".join(text_lines)

        try:
            _send_mailgun(to=admin_email, subject=subject, html_body=html_body, text_body=text_body)
            _record(None, 'admin_weekly_summary', admin_email, subject, text_body, html_body, 'sent')
            self.stdout.write(self.style.SUCCESS(f"Sent weekly summary to {admin_email}."))
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Failed to send: {e}"))
            _record(None, 'admin_weekly_summary', admin_email, subject, text_body, html_body, 'failed', str(e))
