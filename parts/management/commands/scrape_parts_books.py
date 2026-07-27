"""Scrape model book (.xls) files into inbox/ + archive/ (weekly cron).

Downloads each book linked on the source page and queues only those whose content
hash is not already archived. A JSON sidecar carries the display name + cc_class
so the import command doesn't need the page.
"""
import json
import logging
from urllib.parse import urlparse

import requests
from django.core.management.base import BaseCommand

from parts.ingestion import source_page, storage

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Scrape SYM model book .xls files into the books inbox/archive."

    def add_arguments(self, parser):
        parser.add_argument("--url", help="Override the source page URL.")
        parser.add_argument("--force", action="store_true", help="Queue even if the content is already archived.")

    def handle(self, *args, **options):
        page_url = options.get("url") or source_page.SOURCE_URL
        html = source_page.fetch_page(page_url)
        books = source_page.parse_books(html)
        if not books:
            raise SystemExit("No book links found on the page.")

        archived = storage.archived_hashes("books")
        queued = 0
        for book in books:
            try:
                resp = requests.get(book["url"], headers=source_page.REQUEST_HEADERS, timeout=120)
                resp.raise_for_status()
            except requests.RequestException as exc:
                logger.error("Failed to download %s: %s", book["url"], exc)
                self.stderr.write(f"Failed: {book['name']} ({exc})")
                continue
            data = resp.content
            if not options["force"] and storage.sha256_bytes(data) in archived:
                continue
            source_filename = urlparse(book["url"]).path.rsplit("/", 1)[-1] or f"{book['name']}.xls"
            stem, dot, suffix = source_filename.rpartition('.')
            filename = f"{stem or source_filename}-{storage.sha256_bytes(data)[:12]}.{suffix or 'xls'}"
            (storage.archive_dir("books") / filename).write_bytes(data)
            (storage.inbox_dir("books") / filename).write_bytes(data)
            sidecar = {"name": book["name"], "cc_class": book["cc_class"], "url": book["url"]}
            (storage.inbox_dir("books") / f"{filename}.json").write_text(json.dumps(sidecar))
            queued += 1
            self.stdout.write(f"Queued {filename} ({book['name']}).")

        self.stdout.write(self.style.SUCCESS(f"Scraped books: {queued} new/changed of {len(books)} listed."))
