import csv
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from parts.ingestion.easyparts_model_years import (
    DEFAULT_DELAY_SECONDS,
    scrape_sym_hierarchy,
)
from parts.ingestion.sym_model_years import retrieval_timestamp
from parts.models import PartsModel


SOURCE_FIELDS = [
    "customer_name",
    "year_from",
    "year_to",
    "engine",
    "model_code",
    "model_code_raw",
    "generation",
    "frame_number",
    "source_model_id",
    "source_url",
    "source_market",
    "retrieved_at",
]

MATCH_FIELDS = [
    "local_model_name",
    "local_model_code",
    "local_cc_class",
    *SOURCE_FIELDS,
]

UNMATCHED_FIELDS = ["local_model_name", "local_model_code", "local_cc_class"]


def _write_csv(path, fieldnames, rows):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as output:
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


class Command(BaseCommand):
    help = (
        "Scrape SYM fitment identity metadata from EasyParts and match exact "
        "codes to active local books. Products, prices, diagrams, colours, and "
        "images are not collected."
    )

    def add_arguments(self, parser):
        default_dir = Path(settings.BASE_DIR) / "data_management" / "data" / "sym_model_years"
        parser.add_argument("--output-dir", type=Path, default=default_dir)
        parser.add_argument("--refresh", action="store_true", help="Ignore cached source pages.")
        parser.add_argument("--delay", type=float, default=DEFAULT_DELAY_SECONDS)
        parser.add_argument("--max-pages", type=int, default=2000)

    def handle(self, *args, **options):
        if options["delay"] < 3:
            raise CommandError("--delay must be at least 3 seconds.")
        if options["max_pages"] < 1:
            raise CommandError("--max-pages must be positive.")

        output_dir = options["output_dir"]
        cache_dir = output_dir / "cache" / "easyparts"
        local_models = list(PartsModel.objects.filter(is_active=True).order_by("model_code"))
        local_by_code = {model.model_code.upper(): model for model in local_models}

        def progress(visited, pending, relationships):
            self.stdout.write(f"EasyParts: {visited} pages read, {pending} queued.")

        self.stdout.write("Reading the EasyParts SYM model hierarchy...")
        try:
            source_rows, page_count = scrape_sym_hierarchy(
                cache_dir=cache_dir,
                refresh=options["refresh"],
                delay_seconds=options["delay"],
                max_pages=options["max_pages"],
                progress=progress,
            )
        except Exception as exc:
            raise CommandError(f"Could not scrape the EasyParts SYM hierarchy: {exc}") from exc

        retrieved_at = retrieval_timestamp()
        source_output = []
        matched_output = []
        matched_codes = set()
        for relationship in source_rows:
            source_row = {**relationship.as_row(), "retrieved_at": retrieved_at}
            source_output.append(source_row)
            local = local_by_code.get(relationship.model_code)
            if local is None:
                continue
            matched_codes.add(relationship.model_code)
            matched_output.append(
                {
                    "local_model_name": local.name,
                    "local_model_code": local.model_code,
                    "local_cc_class": local.cc_class,
                    **source_row,
                }
            )

        unmatched_output = [
            {
                "local_model_name": model.name,
                "local_model_code": model.model_code,
                "local_cc_class": model.cc_class,
            }
            for model in local_models
            if model.model_code.upper() not in matched_codes
        ]

        source_path = output_dir / "easyparts_sym_relationships.csv"
        matches_path = output_dir / "easyparts_local_exact_code_matches.csv"
        unmatched_path = output_dir / "easyparts_unmatched_local_books.csv"
        _write_csv(source_path, SOURCE_FIELDS, source_output)
        _write_csv(matches_path, MATCH_FIELDS, matched_output)
        _write_csv(unmatched_path, UNMATCHED_FIELDS, unmatched_output)

        self.stdout.write(
            self.style.SUCCESS(
                f"Read {page_count} EasyParts pages and found {len(source_rows)} "
                f"SYM identities. Exact matches cover {len(matched_codes)} of "
                f"{len(local_models)} active local books ({len(matched_output)} records)."
            )
        )
        self.stdout.write(str(source_path))
        self.stdout.write(str(matches_path))
        self.stdout.write(str(unmatched_path))
