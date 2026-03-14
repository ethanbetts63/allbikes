from types import SimpleNamespace

from django.conf import settings
from django.core.management.base import BaseCommand
from django.template.loader import render_to_string
from django.utils import timezone

from notifications.utils.email import _send_mailgun, _record

TEMPLATE_CHOICES = ['test', 'customer_confirmation', 'admin_new_order']


def _fake_order():
    product = SimpleNamespace(
        name="[TEST] Razor E300S Seated Electric Scooter",
        price="999.00",
        discount_price="799.00",
    )
    return SimpleNamespace(
        order_reference="SS-TEST0000",
        customer_name="Test Customer",
        customer_email="test@example.com",
        customer_phone="0400 000 000",
        address_line1="123 Test Street",
        address_line2="Unit 4",
        suburb="Testville",
        state="WA",
        postcode="6000",
        product=product,
        created_at=timezone.now(),
    )


class Command(BaseCommand):
    help = (
        'Sends a test email via Mailgun. '
        'Use --template to preview a real notification template with dummy data.'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--to',
            default=None,
            help='Recipient email address. Defaults to ADMIN_EMAIL.',
        )
        parser.add_argument(
            '--template',
            default='test',
            choices=TEMPLATE_CHOICES,
            help=(
                'Which template to send. '
                '"test" sends a plain test message. '
                '"customer_confirmation" and "admin_new_order" render the real '
                'notification templates with dummy order data.'
            ),
        )

    def handle(self, *args, **options):
        to = options['to'] or getattr(settings, 'ADMIN_EMAIL', None)

        if not to:
            self.stderr.write(self.style.ERROR(
                'No recipient specified and ADMIN_EMAIL is not set. Use --to to provide one.'
            ))
            return

        template = options['template']
        self.stdout.write(f"Sending '{template}' test email to {to}...")

        try:
            if template == 'test':
                subject = "ScooterShop test email"
                body = "This is a test email from the ScooterShop application."
                html_body = render_to_string('notifications/emails/test_email.html', {
                    'subject': subject,
                    'body': body,
                })
                text_body = body

            else:
                order = _fake_order()
                subject = f"[TEST] {'Order confirmed' if template == 'customer_confirmation' else 'New order received'} — {order.order_reference}"
                html_body = render_to_string(
                    f'notifications/emails/{template}.html',
                    {'order': order},
                )
                text_body = f"[TEST] Rendered template: {template}\nOrder: {order.order_reference}"

            message_type = 'test_email' if template == 'test' else template
            _send_mailgun(to=to, subject=subject, html_body=html_body, text_body=text_body)
            _record(None, message_type, to, subject, text_body, html_body, 'sent')
            self.stdout.write(self.style.SUCCESS(f"Sent successfully to {to}."))

        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Failed: {e}"))
