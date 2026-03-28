import os
import re
from django.conf import settings
from data_management.models import TermsAndConditions
from django.utils.timezone import now

VALID_TYPES = {'hire', 'service', 'purchase'}


class TermsUpdateOrchestrator:
    def __init__(self, command):
        self.command = command
        self.data_dir = os.path.join(settings.BASE_DIR, 'data_management', 'data')

    def run(self):
        self.command.stdout.write(self.command.style.SUCCESS("Starting Terms and Conditions update..."))

        # Find all terms_{type}.html files
        html_files = [
            f for f in os.listdir(self.data_dir)
            if re.match(r'^terms_(hire|service|purchase)\.html$', f)
        ]

        if not html_files:
            self.command.stdout.write(self.command.style.WARNING("No 'terms_{type}.html' files found."))
            return

        for file_name in html_files:
            self.process_file(file_name)

        self.command.stdout.write(self.command.style.SUCCESS("Successfully updated Terms and Conditions."))

    def process_file(self, file_name):
        match = re.match(r'^terms_(hire|service|purchase)\.html$', file_name)
        if not match:
            return

        term_type = match.group(1)
        file_path = os.path.join(self.data_dir, file_name)

        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        obj, created = TermsAndConditions.objects.update_or_create(
            term_type=term_type,
            defaults={'content': content, 'published_at': now()},
        )
        action = 'Created' if created else 'Updated'
        self.command.stdout.write(self.command.style.SUCCESS(f"{action} terms: {term_type}"))
