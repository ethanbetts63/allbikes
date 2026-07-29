"""Filesystem layout for the scrape -> inbox -> import pipeline.

    <base>/inbox/pricing    scraped PA files awaiting import
    <base>/inbox/books      scraped book files awaiting import
    <base>/archive/pricing  every PA file ever scraped (dated); the change ledger
    <base>/archive/books    every book file ever scraped

Scraping writes to archive/ + inbox/; importing consumes inbox/ and leaves
archive/ intact.
"""
import hashlib
import json
from pathlib import Path

from django.conf import settings

BASE_DIR = Path(settings.BASE_DIR) / "data_management" / "data" / "sym_parts_files"


def _dir(*parts):
    path = BASE_DIR.joinpath(*parts)
    path.mkdir(parents=True, exist_ok=True)
    return path


def inbox_dir(kind):
    return _dir("inbox", kind)


def archive_dir(kind):
    return _dir("archive", kind)


def sha256_bytes(data):
    return hashlib.sha256(data).hexdigest()


def sha256_file(path):
    return sha256_bytes(Path(path).read_bytes())


def archived_hashes(kind):
    """Set of sha256 hashes of every file already in the archive for ``kind``."""
    return {
        sha256_file(p) for p in archive_dir(kind).glob("*")
        if p.is_file() and p.suffix != '.json'
    }


def queue_file(kind, filename, data, *, metadata=None):
    """Write one immutable source file to its archive and import inbox."""
    archive_path = archive_dir(kind) / filename
    inbox_path = inbox_dir(kind) / filename
    archive_path.write_bytes(data)
    inbox_path.write_bytes(data)
    if metadata is not None:
        sidecar = json.dumps(metadata)
        archive_path.with_name(f'{filename}.json').write_text(sidecar)
        inbox_path.with_name(f'{filename}.json').write_text(sidecar)
    return inbox_path
