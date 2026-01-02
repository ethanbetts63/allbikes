import os
import re
from django.conf import settings
from data_management.models import TermsAndConditions
from django.utils.timezone import now

class TermsUpdateOrchestrator:
    def __init__(self, command):
        self.command = command
        self.data_dir = os.path.join(settings.BASE_DIR, 'data_management', 'data', 'legal')

    def run(self):
        self.command.stdout.write(self.command.style.SUCCESS("Starting Terms and Conditions update..."))

        # Find all terms_v*.html files
        html_files = [f for f in os.listdir(self.data_dir) if re.match(r'terms_v\d+(\.\d+)*\.html', f)]

        if not html_files:
            self.command.stdout.write(self.command.style.WARNING("No 'terms_v*.html' files found."))
            return

        for file_name in html_files:
            self.process_file(file_name)

        self.command.stdout.write(self.command.style.SUCCESS("Successfully updated Terms and Conditions."))

    def process_file(self, file_name):
        # Extract version from filename
        version_match = re.search(r'v([\d\.]+)\.html', file_name)
        if not version_match:
            self.command.stdout.write(self.command.style.ERROR(f"Could not extract version from {file_name}"))
            return

        version = version_match.group(1)

        # Check if this version already exists
        if TermsAndConditions.objects.filter(version=version).exists():
            self.command.stdout.write(self.command.style.NOTICE(f"Version {version} already exists. Skipping."))
            return

        # Read HTML content
        file_path = os.path.join(self.data_dir, file_name)
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Create new TermsAndConditions object
        terms = TermsAndConditions.objects.create(
            version=version,
            content=content,
            published_at=now()
        )
        self.command.stdout.write(self.command.style.SUCCESS(f"Created new Terms and Conditions version: {terms}"))
