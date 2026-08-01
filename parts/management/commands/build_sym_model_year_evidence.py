import csv
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from parts.ingestion.model_year_evidence import combine_exact_code_evidence
from parts.models import PartsModel


EVIDENCE_FIELDS = [
    "local_model_name",
    "local_model_code",
    "local_cc_class",
    "customer_names",
    "year",
    "engines",
    "generations",
    "frame_numbers",
    "evidence_status",
    "source_count",
    "source_names",
    "source_urls",
]

UNMATCHED_FIELDS = ["local_model_name", "local_model_code", "local_cc_class"]


def _read_csv(path):
    if not path.exists():
        raise CommandError(f"Required source report does not exist: {path}")
    with path.open(encoding="utf-8-sig", newline="") as source:
        return list(csv.DictReader(source))


def _write_csv(path, fieldnames, rows):
    with path.open("w", encoding="utf-8-sig", newline="") as output:
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


class Command(BaseCommand):
    help = "Combine exact-code SYM model/year evidence from the scraped selector sources."

    def add_arguments(self, parser):
        default_dir = Path(settings.BASE_DIR) / "data_management" / "data" / "sym_model_years"
        parser.add_argument("--input-dir", type=Path, default=default_dir)
        parser.add_argument("--output-dir", type=Path, default=default_dir)

    def handle(self, *args, **options):
        input_dir = options["input_dir"]
        output_dir = options["output_dir"]
        output_dir.mkdir(parents=True, exist_ok=True)
        dutch_rows = _read_csv(input_dir / "local_catalog_exact_code_matches.csv")
        easyparts_rows = _read_csv(input_dir / "easyparts_local_exact_code_matches.csv")
        local_models = list(PartsModel.objects.filter(is_active=True).order_by("model_code"))
        rows, unmatched = combine_exact_code_evidence(
            dutch_rows=dutch_rows,
            easyparts_rows=easyparts_rows,
            local_models=local_models,
        )

        evidence_path = output_dir / "combined_local_exact_code_years.csv"
        unmatched_path = output_dir / "combined_unmatched_local_books.csv"
        _write_csv(evidence_path, EVIDENCE_FIELDS, rows)
        _write_csv(
            unmatched_path,
            UNMATCHED_FIELDS,
            (
                {
                    "local_model_name": model.name,
                    "local_model_code": model.model_code,
                    "local_cc_class": model.cc_class,
                }
                for model in unmatched
            ),
        )
        matched_count = len(local_models) - len(unmatched)
        corroborated_count = sum(row["source_count"] > 1 for row in rows)
        self.stdout.write(
            self.style.SUCCESS(
                f"Wrote {len(rows)} local code/year rows covering {matched_count} of "
                f"{len(local_models)} books; {corroborated_count} year rows are corroborated."
            )
        )
        self.stdout.write(str(evidence_path))
        self.stdout.write(str(unmatched_path))
