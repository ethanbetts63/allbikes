"""Import scraped Price & Availability files from the pricing inbox (cron B).

Consumes every file in ``inbox/pricing/`` (oldest first), applies it to Part
price/availability, then removes it from the inbox. The archived copy is left
intact for replay/audit.
"""
import logging

from django.core.management.base import BaseCommand

from parts.ingestion import storage
from parts.ingestion.importer import import_pricing
from parts.ingestion.pa_csv import iter_pa_rows

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Import PA files from the pricing inbox into the catalog."

    def add_arguments(self, parser):
        parser.add_argument("--file", help="Import a specific CSV path directly, bypassing the inbox.")

    def handle(self, *args, **options):
        if options.get("file"):
            applied = import_pricing(iter_pa_rows(options["file"]))
            self.stdout.write(self.style.SUCCESS(f"Imported {applied} rows from {options['file']}."))
            return

        files = sorted(storage.inbox_dir("pricing").glob("*.csv"))
        if not files:
            self.stdout.write("Pricing inbox is empty — nothing to import.")
            return

        for path in files:
            applied = import_pricing(iter_pa_rows(str(path)))
            path.unlink()
            self.stdout.write(self.style.SUCCESS(f"Imported {applied} rows from {path.name}; removed from inbox."))
