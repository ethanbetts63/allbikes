import csv
import sys
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from parts.ingestion.sym_model_years import retrieval_timestamp
from parts.ingestion.vehicle_registrations import group_registrations, is_sym_row


FIELDS = [
    "vin_prefix",
    "make",
    "model",
    "capacity",
    "registration_count",
    "first_year",
    "last_year",
    "observed_years",
    "candidate_local_books",
    "source_files",
    "retrieved_at",
]

# Registration extracts are tens of megabytes with long free-text columns.
csv.field_size_limit(min(sys.maxsize, 2**31 - 1))


class Command(BaseCommand):
    help = (
        "Read Australian motorcycle registration extracts as model-year evidence "
        "for SYM/Bolwell vehicles actually registered here."
    )

    def add_arguments(self, parser):
        default_dir = Path(settings.BASE_DIR) / "data_management" / "data" / "sym_model_years"
        parser.add_argument("--input-dir", type=Path, default=default_dir)
        parser.add_argument("--output-dir", type=Path, default=default_dir)
        parser.add_argument(
            "--pattern",
            default="*motorcycles*reg*.csv,*vehicleregistrationsmotorcycles*.csv",
            help="Comma-separated globs identifying the registration extracts.",
        )

    def handle(self, *args, **options):
        from parts.models import PartsModel

        paths = sorted(
            {
                path
                for pattern in options["pattern"].split(",")
                for path in options["input_dir"].glob(pattern.strip())
            }
        )
        if not paths:
            raise CommandError(f"No registration extracts matched in {options['input_dir']}")

        rows, per_file = [], []
        for path in paths:
            with path.open(encoding="utf-8-sig", newline="") as handle:
                matched = [row for row in csv.DictReader(handle) if is_sym_row(row)]
            per_file.append((path.name, len(matched)))
            rows.extend(matched)
            self.stdout.write(f"  {path.name}: {len(matched):,} SYM/Bolwell rows")

        local_models = list(
            PartsModel.objects.filter(is_active=True).values_list("model_code", "cc_class")
        )
        groups = group_registrations(rows, local_models)

        retrieved_at = retrieval_timestamp()
        output_path = options["output_dir"] / "registration_year_evidence.csv"
        source_files = " | ".join(name for name, _ in per_file)
        with output_path.open("w", encoding="utf-8-sig", newline="") as output:
            writer = csv.DictWriter(output, fieldnames=FIELDS)
            writer.writeheader()
            writer.writerows(
                {**group.as_row(), "source_files": source_files, "retrieved_at": retrieved_at}
                for group in groups
            )

        linked = [g for g in groups if g.candidate_local_books]
        books = sorted({b for g in linked for b in g.candidate_local_books.split(" | ")})
        self.stdout.write(
            self.style.SUCCESS(
                f"{len(rows):,} SYM/Bolwell registrations grouped into {len(groups)} "
                f"model records; {len(linked)} link to {len(books)} local books."
            )
        )
        self.stdout.write(
            "A registration year is when the vehicle was built, not when its parts book was "
            "issued, and the VIN prefix exposes only two characters of the model code — so "
            "this is family evidence, matched on prefix plus capacity."
        )
        self.stdout.write(str(output_path))
