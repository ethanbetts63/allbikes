import logging
from urllib.parse import urlparse

import requests

from parts.ingestion import source_page, storage

logger = logging.getLogger(__name__)


def run(*, stdout, stderr, url=None, force=False):
    page_url = url or source_page.SOURCE_URL
    books = source_page.parse_books(source_page.fetch_page(page_url))
    if not books:
        raise RuntimeError('No book links found on the page.')

    archived = storage.archived_hashes('books')
    queued = 0
    for book in books:
        try:
            data = source_page.download_bytes(book['url'], timeout=120)
        except requests.RequestException as exc:
            logger.error('Failed to download %s: %s', book['url'], exc)
            stderr.write(f"Failed: {book['name']} ({exc})")
            continue
        digest = storage.sha256_bytes(data)
        if not force and digest in archived:
            continue
        source_filename = urlparse(book['url']).path.rsplit('/', 1)[-1] or f"{book['name']}.xls"
        stem, _, suffix = source_filename.rpartition('.')
        filename = f"{stem or source_filename}-{digest[:12]}.{suffix or 'xls'}"
        storage.queue_file(
            'books',
            filename,
            data,
            metadata={
                'name': book['name'],
                'cc_class': book['cc_class'],
                'url': book['url'],
            },
        )
        archived.add(digest)
        queued += 1
        stdout.write(f"Queued {filename} ({book['name']}).")

    stdout.write(f"Scraped parts: {queued} new/changed of {len(books)} listed.")
    return queued
