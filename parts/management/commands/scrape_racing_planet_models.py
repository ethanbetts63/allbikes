import csv
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from parts.ingestion.racing_planet_models import fetch_selector, parse_selector
from parts.ingestion.sym_model_years import retrieval_timestamp


FIELDS = [
    "selector_id",
    "source_title",
    "model_code",
    "year_from",
    "year_to",
    "range_is_open",
    "source_url",
    "source_market",
    "retrieved_at",
]


class Command(BaseCommand):
    help = "Collect the complete SYM model dropdown from Racing Planet (one cached request)."

    def add_arguments(self, parser):
        default_dir = Path(settings.BASE_DIR) / "data_management" / "data" / "sym_model_years"
        parser.add_argument("--output-dir", type=Path, default=default_dir)
        parser.add_argument("--refresh", action="store_true")

    def handle(self, *args, **options):
        output_dir = options["output_dir"]
        cache_path = output_dir / "cache" / "racing_planet" / "models.html"
        cache_path.parent.mkdir(parents=True, exist_ok=True)
        try:
            if cache_path.exists() and not options["refresh"]:
                html = cache_path.read_text(encoding="utf-8")
            else:
                html = fetch_selector()
                cache_path.write_text(html, encoding="utf-8")
        except Exception as exc:
            raise CommandError(f"Could not read the Racing Planet selector: {exc}") from exc

        retrieved_at = retrieval_timestamp()
        rows = [{**relationship.as_row(), "retrieved_at": retrieved_at} for relationship in parse_selector(html)]
        output_path = output_dir / "racing_planet_sym_relationships.csv"
        with output_path.open("w", encoding="utf-8-sig", newline="") as output:
            writer = csv.DictWriter(output, fieldnames=FIELDS)
            writer.writeheader()
            writer.writerows(rows)
        self.stdout.write(self.style.SUCCESS(f"Wrote {len(rows)} Racing Planet SYM model claims."))
        self.stdout.write(str(output_path))
