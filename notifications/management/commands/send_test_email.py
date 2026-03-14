from django.conf import settings
from django.core.management.base import BaseCommand

from notifications.utils.email import _send_mailgun


class Command(BaseCommand):
    help = 'Sends a test email via Mailgun to verify the integration is working.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--to',
            default=None,
            help='Recipient email address. Defaults to ADMIN_EMAIL.',
        )
        parser.add_argument(
            '--subject',
            default='ScooterShop test email',
            help='Subject line. Defaults to "ScooterShop test email".',
        )
        parser.add_argument(
            '--body',
            default='This is a test email from the ScooterShop application.',
            help='Body text.',
        )

    def handle(self, *args, **options):
        to = options['to'] or getattr(settings, 'ADMIN_EMAIL', None)

        if not to:
            self.stderr.write(self.style.ERROR(
                'No recipient specified and ADMIN_EMAIL is not set. Use --to to provide one.'
            ))
            return

        subject = options['subject']
        body = options['body']

        self.stdout.write(f"Sending test email to {to}...")

        try:
            _send_mailgun(to=to, subject=subject, html_body=f"<p>{body}</p>", text_body=body)
            self.stdout.write(self.style.SUCCESS(f"Email sent successfully to {to}."))
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Failed to send email: {e}"))
