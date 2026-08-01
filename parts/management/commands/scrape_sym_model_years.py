import csv
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from parts.ingestion.sym_model_years import (
    DEFAULT_DELAY_SECONDS,
    parse_cached_relationships,
    retrieval_timestamp,
    scrape_model_codes,
)
from parts.models import PartsModel


RELATIONSHIP_FIELDS = [
    "local_model_name",
    "local_model_code",
    "local_cc_class",
    "customer_name",
    "variant",
    "year",
    "source_model_code",
    "code_qualifiers",
    "vehicle_type",
    "engine_cc",
    "catalog_id",
    "source_title",
    "source_url",
    "source_market",
    "retrieved_at",
]

UNMATCHED_FIELDS = ["local_model_name", "local_model_code", "local_cc_class"]

SOURCE_FIELDS = [
    "customer_name",
    "variant",
    "year",
    "model_code",
    "code_qualifiers",
    "vehicle_type",
    "engine_cc",
    "catalog_id",
    "source_title",
    "source_url",
    "source_market",
    "retrieved_at",
]


def _write_csv(path, fieldnames, rows):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as output:
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


class Command(BaseCommand):
    help = (
        "Scrape only SYM model/year/code metadata and match it to active local "
        "Australian parts books. No prices, parts, diagrams, or images are collected."
    )

    def add_arguments(self, parser):
        default_dir = Path(settings.BASE_DIR) / "data_management" / "data" / "sym_model_years"
        parser.add_argument("--output-dir", type=Path, default=default_dir)
        parser.add_argument("--refresh", action="store_true", help="Ignore cached source pages.")
        parser.add_argument(
            "--delay",
            type=float,
            default=DEFAULT_DELAY_SECONDS,
            help="Seconds between requests (the source robots.txt requests 5 seconds).",
        )

    def handle(self, *args, **options):
        if options["delay"] < 5:
            raise CommandError("--delay must be at least 5 seconds to respect the source crawl delay.")

        output_dir = options["output_dir"]
        cache_dir = output_dir / "cache"
        local_models = list(PartsModel.objects.filter(is_active=True).order_by("model_code"))
        local_by_code = {model.model_code.upper(): model for model in local_models}
        self.stdout.write("Reading the SYM model selector (vehicle identity metadata only)...")
        try:
            source_rows = scrape_model_codes(
                local_by_code,
                cache_dir=cache_dir,
                refresh=options["refresh"],
                delay_seconds=options["delay"],
            )
        except Exception as exc:
            raise CommandError(f"Could not scrape the SYM model selector: {exc}") from exc

        retrieved_at = retrieval_timestamp()
        matched_rows = []
        matched_codes = set()

        for source in source_rows:
            local = local_by_code.get(source.model_code.upper())
            if local is None:
                continue
            matched_codes.add(local.model_code.upper())
            matched_rows.append(
                {
                    "local_model_name": local.name,
                    "local_model_code": local.model_code,
                    "local_cc_class": local.cc_class,
                    "customer_name": source.customer_name,
                    "variant": source.variant,
                    "year": source.year,
                    "source_model_code": source.model_code,
                    "code_qualifiers": source.code_qualifiers,
                    "vehicle_type": source.vehicle_type,
                    "engine_cc": source.engine_cc,
                    "catalog_id": source.catalog_id,
                    "source_title": source.source_title,
                    "source_url": source.source_url,
                    "source_market": source.source_market,
                    "retrieved_at": retrieved_at,
                }
            )

        unmatched_rows = [
            {
                "local_model_name": model.name,
                "local_model_code": model.model_code,
                "local_cc_class": model.cc_class,
            }
            for model in local_models
            if model.model_code.upper() not in matched_codes
        ]
        relationships_path = output_dir / "local_catalog_exact_code_matches.csv"
        unmatched_path = output_dir / "unmatched_local_books.csv"
        all_source_path = output_dir / "bike_parts_sym_relationships.csv"
        all_source_rows = [
            {**relationship.as_row(), "retrieved_at": retrieved_at}
            for relationship in parse_cached_relationships(cache_dir)
        ]
        _write_csv(relationships_path, RELATIONSHIP_FIELDS, matched_rows)
        _write_csv(unmatched_path, UNMATCHED_FIELDS, unmatched_rows)
        _write_csv(all_source_path, SOURCE_FIELDS, all_source_rows)

        self.stdout.write(
            self.style.SUCCESS(
                f"Found {len(source_rows)} source relationships; wrote {len(matched_rows)} "
                f"exact local-code relationships covering {len(matched_codes)} of "
                f"{len(local_models)} active local books."
            )
        )
        self.stdout.write(str(relationships_path))
        self.stdout.write(str(unmatched_path))
        self.stdout.write(str(all_source_path))
