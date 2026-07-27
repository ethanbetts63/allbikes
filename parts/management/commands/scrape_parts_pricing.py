"""Scrape the current Price & Availability CSV into inbox/ + archive/ (cron A).

Downloads the PA file only when it is new (its content hash is not already
archived), so the paired import command has work only when something changed.
"""
import logging

import requests
from django.core.management.base import BaseCommand

from parts.ingestion import source_page, storage

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Scrape the SYM Price & Availability CSV into the pricing inbox/archive."

    def add_arguments(self, parser):
        parser.add_argument("--url", help="Override the source page URL.")
        parser.add_argument("--force", action="store_true", help="Write even if the content is already archived.")

    def handle(self, *args, **options):
        page_url = options.get("url") or source_page.SOURCE_URL
        html = source_page.fetch_page(page_url)
        pa_url, pa_date = source_page.parse_pa_link(html)
        if not pa_url:
            raise SystemExit("Could not find the Price & Availability link on the page.")

        resp = requests.get(pa_url, headers=source_page.REQUEST_HEADERS, timeout=60)
        resp.raise_for_status()
        data = resp.content
        digest = storage.sha256_bytes(data)

        if not options["force"] and digest in storage.archived_hashes("pricing"):
            self.stdout.write("No change — current PA file is already archived.")
            return

        stamp = pa_date.isoformat() if pa_date else "undated"
        # A source URL may be replaced more than once on the same date. Include
        # its hash so archive/ remains an append-only audit trail.
        filename = f"PA-{stamp}-{digest[:12]}.csv"
        (storage.archive_dir("pricing") / filename).write_bytes(data)
        (storage.inbox_dir("pricing") / filename).write_bytes(data)
        self.stdout.write(self.style.SUCCESS(f"Scraped new PA file {filename} ({len(data)} bytes) -> inbox."))
