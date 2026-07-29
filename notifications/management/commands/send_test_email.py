from types import SimpleNamespace

from django.core.management.base import BaseCommand
from django.template.loader import render_to_string

from notifications.utils.email import _admin_recipients, _record, _send_mailgun

TEMPLATE_CHOICES = [
    'test',
    'product_order_confirmation',
    'bike_order_confirmation',
    'product_admin_new_order',
    'bike_admin_new_order',
]


def _fake_order(template):
    common = {
        'customer_name': 'Test Customer',
        'customer_email': 'test@example.com',
        'customer_phone': '0400 000 000',
        'amount_paid': '799.00',
    }
    if template.startswith('bike_'):
        return SimpleNamespace(
            **common,
            order_reference='BK-TEST0000',
            motorcycle='2026 SYM Jet X 125',
            selected_colour='Matte Black',
        )
    return SimpleNamespace(
        **common,
        order_reference='PR-TEST0000',
        product=SimpleNamespace(name='Razor E300S Electric Scooter'),
        unit_price_incl_gst='799.00',
        address_line1='123 Test Street',
        address_line2='Unit 4',
        suburb='Testville',
        state='WA',
        postcode='6000',
    )


class Command(BaseCommand):
    help = 'Sends a test email via Mailgun, optionally rendering a current order template.'

    def add_arguments(self, parser):
        parser.add_argument('--to', default=None)
        parser.add_argument('--template', default='test', choices=TEMPLATE_CHOICES)

    def handle(self, *args, **options):
        recipients = [options['to']] if options['to'] else _admin_recipients()
        if not recipients:
            self.stderr.write(self.style.ERROR(
                'No recipient specified and no admin emails are configured. Use --to to provide one.'
            ))
            return

        template = options['template']
        try:
            if template == 'test':
                subject = 'ScooterShop test email'
                text_body = 'This is a test email from the ScooterShop application.'
                html_body = render_to_string(
                    'notifications/emails/test_email.html',
                    {'subject': subject, 'body': text_body},
                )
            else:
                order = _fake_order(template)
                subject = f'[TEST] {template.replace("_", " ").title()} — {order.order_reference}'
                html_body = render_to_string(
                    f'notifications/emails/{template}.html', {'order': order}
                )
                text_body = f'[TEST] Rendered {template}: {order.order_reference}'

            for to in recipients:
                _send_mailgun(to=to, subject=subject, html_body=html_body, text_body=text_body)
                _record(None, 'test_email', to, subject, text_body, html_body, 'sent')
            self.stdout.write(self.style.SUCCESS(
                f'Sent successfully to {len(recipients)} recipient(s).'
            ))
        except Exception as exc:
            self.stderr.write(self.style.ERROR(f'Failed: {exc}'))
