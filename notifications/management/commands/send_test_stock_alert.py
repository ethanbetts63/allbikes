"""Send the stock-alert email to a single address so it can be checked in a real inbox.

Deliberately not a thin wrapper around `send_next_stock_alert`: that sends to every
active subscriber and clears `include_in_stock_alerts` on the listings it sent. This
command sends to one address, writes no Message rows, and leaves the real queue
exactly as it was, so it is safe to run against production.
"""
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db.models import Prefetch
from django.template.loader import render_to_string

from inventory.models import Motorcycle, MotorcycleImage
from inventory.stock_alerts import STOCK_ALERT_SUBJECT, _text_body, eligible_bikes, queue_items
from notifications.utils.email import _send_mailgun

DEFAULT_RECIPIENT = 'ethanbetts63@gmail.com'


def _every_listing():
    """Same shape as `eligible_bikes()`, minus the opt-in filter."""
    return Motorcycle.objects.prefetch_related(
        Prefetch('images', queryset=MotorcycleImage.objects.order_by('order', 'id'), to_attr='stock_alert_images'),
    ).order_by('-date_posted', '-id')


class Command(BaseCommand):
    help = (
        'Sends the stock-alert email to a single address for checking in a real inbox. '
        'Does not touch subscribers, does not write Message rows, and does not clear '
        'include_in_stock_alerts, so the real queue is left untouched.'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--to', default=DEFAULT_RECIPIENT,
            help=f'Recipient address. Defaults to {DEFAULT_RECIPIENT}.',
        )
        parser.add_argument(
            '--all', action='store_true',
            help='Include every listing rather than only those flagged for the next alert. '
                 'Useful when the queue is empty but you still want to see the images.',
        )
        parser.add_argument(
            '--dry-run', action='store_true',
            help='Render and report, but do not send.',
        )

    def handle(self, *args, **options):
        recipient = options['to']
        bikes = list(_every_listing() if options['all'] else eligible_bikes())
        bikes = [bike for bike in bikes if bike.stock_alert_images]
        if not bikes:
            raise CommandError(
                'No listings with images to send. Nothing is flagged for the next alert — '
                'pass --all to include every listing anyway.'
            )

        # Accessing each variant's URL is what generates it, so this has to happen on the
        # host that serves MEDIA, or the <img> tags will point at files that do not exist.
        items = queue_items(bikes)

        unsubscribe_url = f'{settings.SITE_URL}/used-stock/unsubscribe/preview'
        html_body = render_to_string('notifications/emails/stock_alert_update.html', {
            'items': items,
            'unsubscribe_url': unsubscribe_url,
        })
        text_body = _text_body(items, unsubscribe_url)

        self.stdout.write(f'{len(items)} listing(s), images served from {settings.API_URL}:')
        for item in items:
            marker = ' ' if item['image_url'].endswith('.jpg') else ' [not a flattened JPEG]'
            self.stdout.write(f"  {item['position']:>2}. {item['title']}{marker}")
            self.stdout.write(f"      {item['image_url']}")

        if options['dry_run']:
            self.stdout.write(self.style.WARNING(f'Dry run — nothing sent to {recipient}.'))
            return

        try:
            _send_mailgun(to=recipient, subject=STOCK_ALERT_SUBJECT,
                          html_body=html_body, text_body=text_body)
        except Exception as exc:
            raise CommandError(f'Send failed: {exc}')

        self.stdout.write(self.style.SUCCESS(f'Sent to {recipient}.'))
