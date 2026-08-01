import csv
from pathlib import Path

import xlrd
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from parts.ingestion.sym_model_years import retrieval_timestamp
from parts.ingestion.workbook_revisions import (
    RESUME_SHEET_RE,
    parse_resume_model_code,
    parse_revision_entries,
    summarise,
)
from parts.ingestion.xls_parser import parse_model_code


FIELDS = [
    "source_file",
    "declared_model_code",
    "revision_count",
    "first_revision_date",
    "last_revision_date",
    "revision_years",
    "sheet_name_years",
    "all_activity_years",
    "retrieved_at",
]


def _sheet_rows(sheet):
    values = [[sheet.cell_value(r, c) for c in range(sheet.ncols)] for r in range(sheet.nrows)]
    types = [[sheet.cell_type(r, c) for c in range(sheet.ncols)] for r in range(sheet.nrows)]
    return values, types


class Command(BaseCommand):
    help = (
        "Mine dated maintenance activity out of the local SYM parts workbooks. "
        "These are the only artifacts that carry the full local code."
    )

    def add_arguments(self, parser):
        base = Path(settings.BASE_DIR) / "data_management" / "data"
        parser.add_argument("--books-dir", type=Path, default=base / "sym_parts_files" / "archive" / "books")
        parser.add_argument("--output-dir", type=Path, default=base / "sym_model_years")

    def handle(self, *args, **options):
        books_dir = options["books_dir"]
        if not books_dir.exists():
            raise CommandError(f"Workbook directory does not exist: {books_dir}")
        paths = sorted(books_dir.glob("*.xls"))
        if not paths:
            raise CommandError(f"No .xls workbooks found in {books_dir}")
        self.stdout.write(f"Reading {len(paths)} local parts workbooks...")

        summaries, unreadable, without_log = [], [], []
        for index, path in enumerate(paths, start=1):
            try:
                book = xlrd.open_workbook(path, formatting_info=False)
            except Exception as exc:
                unreadable.append((path.name, str(exc)))
                continue
            sheet_names = book.sheet_names()
            entries, declared = [], ""
            for name in sheet_names:
                if not RESUME_SHEET_RE.search(name):
                    continue
                values, types = _sheet_rows(book.sheet_by_name(name))
                declared = declared or parse_resume_model_code(values)
                entries.extend(
                    parse_revision_entries(values, cell_types=types, datemode=book.datemode)
                )
            if not declared:
                # Fall back to the code the book states on its index sheets, so
                # a workbook without a change log still reports its identity.
                try:
                    declared = parse_model_code(book)
                except Exception:
                    declared = ""
            if not entries:
                without_log.append(path.name)
            summaries.append(
                summarise(
                    source_file=path.name,
                    declared_model_code=(declared or "").upper(),
                    entries=entries,
                    sheet_names=sheet_names,
                )
            )
            if index % 15 == 0 or index == len(paths):
                self.stdout.write(f"  [{index}/{len(paths)}] read.")

        retrieved_at = retrieval_timestamp()
        output_path = options["output_dir"] / "workbook_revision_evidence.csv"
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with output_path.open("w", encoding="utf-8-sig", newline="") as output:
            writer = csv.DictWriter(output, fieldnames=FIELDS)
            writer.writeheader()
            writer.writerows(
                {**summary.as_row(), "retrieved_at": retrieved_at} for summary in summaries
            )

        dated = [s for s in summaries if s.all_activity_years]
        self.stdout.write(
            self.style.SUCCESS(
                f"Read {len(summaries)} workbooks; {len(dated)} carry dated activity."
            )
        )
        if without_log:
            self.stdout.write(f"No change log in {len(without_log)} workbooks.")
        for name, exc in unreadable:
            self.stderr.write(f"  unreadable: {name}: {exc}")
        self.stdout.write(
            "Workbook dates are document-maintenance evidence, not production ranges: they "
            "show the book was live in the parts system, not that a vehicle was built or sold."
        )
        self.stdout.write(str(output_path))
