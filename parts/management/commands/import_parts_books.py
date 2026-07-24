"""Import scraped model books from the books inbox.

Parses each ``.xls`` in ``inbox/books/`` (with its JSON sidecar for name/cc_class),
upserts it into the catalog, then removes it from the inbox. Archived copies are
left intact for replay/audit.
"""
import json
import logging

from django.core.management.base import BaseCommand

from parts.ingestion import storage
from parts.ingestion.importer import import_book
from parts.ingestion.xls_parser import parse_book
from parts.models import PartsModel

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Import model books from the books inbox into the catalog."

    def add_arguments(self, parser):
        parser.add_argument("--file", help="Import a specific .xls path directly, bypassing the inbox.")
        parser.add_argument("--name", help="Display name (with --file).")
        parser.add_argument("--cc-class", dest="cc_class", help="cc_class code (with --file).")

    def handle(self, *args, **options):
        if options.get("file"):
            self._import_one(
                options["file"],
                name=options.get("name"),
                cc_class=options.get("cc_class"),
                source_url="",
            )
            return

        xls_files = sorted(storage.inbox_dir("books").glob("*.xls"))
        if not xls_files:
            self.stdout.write("Books inbox is empty — nothing to import.")
            return

        for path in xls_files:
            sidecar_path = path.with_name(f"{path.name}.json")
            meta = {}
            if sidecar_path.exists():
                meta = json.loads(sidecar_path.read_text())
            self._import_one(
                str(path),
                name=meta.get("name"),
                cc_class=meta.get("cc_class"),
                source_url=meta.get("url", ""),
                source_filename=path.name,
            )
            path.unlink()
            if sidecar_path.exists():
                sidecar_path.unlink()

        self.stdout.write(self.style.SUCCESS("Books inbox drained."))

    def _import_one(self, path, *, name, cc_class, source_url, source_filename=""):
        parsed = parse_book(path)
        book_hash = storage.sha256_file(path)
        if book_hash and PartsModel.objects.filter(model_code=parsed["model_code"], book_hash=book_hash).exists():
            self.stdout.write(f"Skipped {parsed['model_code']}: already imported (hash match).")
            return
        model = import_book(
            parsed,
            name=name,
            cc_class=cc_class,
            source_url=source_url,
            source_filename=source_filename or path.rsplit("/", 1)[-1],
            book_hash=book_hash,
        )
        self.stdout.write(self.style.SUCCESS(
            f"Imported {model} — {model.sections.count()} sections."
        ))
