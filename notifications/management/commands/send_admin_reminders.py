from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone

from notifications.utils.email import _send_mailgun, _record
from payments.models import Order


class Command(BaseCommand):
    help = 'Sends a weekly admin summary of paid and dispatched orders. Runs only on Mondays.'

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

        paid_orders = list(Order.objects.filter(status='paid').order_by('created_at'))
        dispatched_orders = list(Order.objects.filter(status='dispatched').order_by('created_at'))

        if not paid_orders and not dispatched_orders:
            self.stdout.write("No paid or dispatched orders — nothing to send.")
            return

        subject = f"Weekly order summary — {today.strftime('%d %b %Y')}"

        lines = ["Weekly Order Summary\n"]

        lines.append(f"PAID — awaiting dispatch ({len(paid_orders)})")
        lines.append("-" * 40)
        if paid_orders:
            for order in paid_orders:
                lines.append(
                    f"  {order.order_reference}  |  {order.customer_name}  |  "
                    f"{order.product.name}  |  "
                    f"Placed: {timezone.localtime(order.created_at).strftime('%d %b %Y')}"
                )
        else:
            lines.append("  None.")

        lines.append("")
        lines.append(f"DISPATCHED — awaiting delivery ({len(dispatched_orders)})")
        lines.append("-" * 40)
        if dispatched_orders:
            for order in dispatched_orders:
                lines.append(
                    f"  {order.order_reference}  |  {order.customer_name}  |  "
                    f"{order.product.name}  |  "
                    f"Placed: {timezone.localtime(order.created_at).strftime('%d %b %Y')}"
                )
        else:
            lines.append("  None.")

        text_body = "\n".join(lines)
        html_body = "<pre style='font-family:monospace;font-size:14px;'>" + text_body + "</pre>"

        try:
            _send_mailgun(to=admin_email, subject=subject, html_body=html_body, text_body=text_body)
            _record(None, 'admin_weekly_summary', admin_email, subject, text_body, html_body, 'sent')
            self.stdout.write(self.style.SUCCESS(f"Sent weekly summary to {admin_email}."))
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Failed to send: {e}"))
            _record(None, 'admin_weekly_summary', admin_email, subject, text_body, html_body, 'failed', str(e))
