import csv
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from parts.ingestion.sym_model_years import retrieval_timestamp
from parts.ingestion.taiwan_emissions import SYM_MANUFACTURER, scrape_sym_certifications


FIELDS = [
    "manufacturer",
    "brand",
    "model_code",
    "model_year",
    "model_name",
    "certificate_number",
    "engine_family",
    "displacement_cc",
    "standard_date",
    "application_type",
    "source_url",
    "retrieved_at",
]


def _console_safe(value):
    """Render text that a legacy Windows console codepage cannot encode.

    The manufacturer filter is Chinese, and cp1252 consoles raise rather than
    substitute, so progress output would crash a run that is otherwise fine.
    """
    try:
        value.encode(getattr(__import__("sys").stdout, "encoding", None) or "utf-8")
    except (UnicodeEncodeError, LookupError):
        return value.encode("unicode_escape").decode("ascii")
    return value


class Command(BaseCommand):
    help = (
        "Read SYM model years from Taiwan's open new-motorcycle emissions "
        "certification register (Ministry of Environment dataset MPI_P_04)."
    )

    def add_arguments(self, parser):
        default_dir = Path(settings.BASE_DIR) / "data_management" / "data" / "sym_model_years"
        parser.add_argument("--output-dir", type=Path, default=default_dir)
        parser.add_argument("--manufacturer", default=SYM_MANUFACTURER)

    def handle(self, *args, **options):
        self.stdout.write(
            f"Reading the Taiwan register for manufacturer {_console_safe(options['manufacturer'])}..."
        )

        def progress(read, total):
            self.stdout.write(f"  {read}/{total} register rows read.")

        try:
            certifications = scrape_sym_certifications(
                manufacturer=options["manufacturer"], progress=progress
            )
        except Exception as exc:
            raise CommandError(f"Could not read the Taiwan emissions register: {exc}") from exc

        retrieved_at = retrieval_timestamp()
        output_path = options["output_dir"] / "taiwan_emissions_certifications.csv"
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with output_path.open("w", encoding="utf-8-sig", newline="") as output:
            writer = csv.DictWriter(output, fieldnames=FIELDS)
            writer.writeheader()
            writer.writerows(
                {**item.as_row(), "retrieved_at": retrieved_at} for item in certifications
            )

        codes = sorted({item.model_code for item in certifications})
        years = sorted({item.model_year for item in certifications})
        self.stdout.write(
            self.style.SUCCESS(
                f"Wrote {len(certifications)} dated certifications covering "
                f"{len(codes)} model codes, {years[0]}-{years[-1]}."
            )
        )
        self.stdout.write(
            "Register covers only the emissions standard in force from 2021-01-01, and "
            "Taiwan-domestic codes are often not export codes; treat matches as core-code "
            "family evidence, never as local parts-book confirmation."
        )
        self.stdout.write(str(output_path))
