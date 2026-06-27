from django.conf import settings
from django.core.management.base import BaseCommand
from twilio.rest import Client


class Command(BaseCommand):
    help = 'Sends a test SMS to all ADMIN_NUMBERS via Twilio (ignores DEBUG mode).'

    def add_arguments(self, parser):
        parser.add_argument(
            '--to',
            default=None,
            help='Override recipient number (E.164 format, e.g. +61423853830). Defaults to ADMIN_NUMBERS.',
        )
        parser.add_argument(
            '--message',
            default='Test SMS from ScooterShop.',
            help='Message body to send.',
        )

    def handle(self, *args, **options):
        numbers = [options['to']] if options['to'] else getattr(settings, 'ADMIN_NUMBERS', [])

        if not numbers:
            self.stderr.write(self.style.ERROR(
                'No numbers configured. Set ADMIN_NUMBERS in your .env or use --to.'
            ))
            return

        body = options['message']
        self.stdout.write(f"Sending test SMS to {', '.join(numbers)}...")

        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        for number in numbers:
            try:
                msg = client.messages.create(
                    body=body,
                    messaging_service_sid=settings.TWILIO_MESSAGING_SERVICE_SID,
                    to=number,
                )
                self.stdout.write(self.style.SUCCESS(f"  Sent to {number} — SID: {msg.sid}"))
            except Exception as e:
                self.stderr.write(self.style.ERROR(f"  Failed to send to {number}: {e}"))
