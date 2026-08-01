import csv
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from parts.ingestion.oemmotorparts_model_years import (
    DEFAULT_DELAY_SECONDS,
    PAGE_COUNT,
    scrape_sym_index,
)
from parts.ingestion.sym_model_years import retrieval_timestamp


FIELDS = [
    "source_title",
    "model_code",
    "year_from",
    "year_to",
    "generation",
    "source_page",
    "source_url",
    "retrieved_at",
]


class Command(BaseCommand):
    help = "Read explicit model-code/year listings from OEM Motorparts' ten-page public SYM index."

    def add_arguments(self, parser):
        default_dir = Path(settings.BASE_DIR) / "data_management" / "data" / "sym_model_years"
        parser.add_argument("--output-dir", type=Path, default=default_dir)
        parser.add_argument("--delay", type=float, default=DEFAULT_DELAY_SECONDS)

    def handle(self, *args, **options):
        if options["delay"] < 0.5:
            raise CommandError("--delay must be at least 0.5 seconds.")
        self.stdout.write(f"Reading {PAGE_COUNT} OEM Motorparts SYM index pages...")

        def progress(page_count, page_rows, total_rows):
            self.stdout.write(
                f"OEM Motorparts: page {page_count}/{PAGE_COUNT}; "
                f"{page_rows} code listings ({total_rows} total)."
            )

        try:
            source_rows = scrape_sym_index(delay_seconds=options["delay"], progress=progress)
        except Exception as exc:
            raise CommandError(f"Could not read the OEM Motorparts SYM index: {exc}") from exc

        retrieved_at = retrieval_timestamp()
        output_path = options["output_dir"] / "oemmotorparts_sym_relationships.csv"
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with output_path.open("w", encoding="utf-8-sig", newline="") as output:
            writer = csv.DictWriter(output, fieldnames=FIELDS)
            writer.writeheader()
            writer.writerows({**row.as_row(), "retrieved_at": retrieved_at} for row in source_rows)
        self.stdout.write(self.style.SUCCESS(f"Wrote {len(source_rows)} OEM Motorparts code/year listings."))
        self.stdout.write(str(output_path))
