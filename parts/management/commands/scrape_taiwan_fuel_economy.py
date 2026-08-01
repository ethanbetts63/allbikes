import csv
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from parts.ingestion.sym_model_years import retrieval_timestamp
from parts.ingestion.taiwan_fuel_economy import SYM_BRAND, fetch_archive, parse_archive


FIELDS = [
    "brand",
    "model_text",
    "model_code",
    "issue_date",
    "displacement_cc",
    "applicant",
    "source_file",
    "source_url",
    "retrieved_at",
]


class Command(BaseCommand):
    help = (
        "Read SYM fuel-economy certificate issue dates from Taiwan's MOEA monthly "
        "open-data archive (2017 onwards)."
    )

    def add_arguments(self, parser):
        default_dir = Path(settings.BASE_DIR) / "data_management" / "data" / "sym_model_years"
        parser.add_argument("--output-dir", type=Path, default=default_dir)
        parser.add_argument("--brand", default=SYM_BRAND)
        parser.add_argument("--refresh", action="store_true", help="Ignore the cached archive.")

    def handle(self, *args, **options):
        output_dir = options["output_dir"]
        cache_path = output_dir / "cache" / "moea" / "fuel-economy-archive.zip"
        if cache_path.exists() and not options["refresh"]:
            self.stdout.write(f"Using cached archive {cache_path}")
            data = cache_path.read_bytes()
        else:
            self.stdout.write("Downloading the MOEA fuel-economy archive...")
            try:
                data = fetch_archive()
            except Exception as exc:
                raise CommandError(f"Could not download the MOEA archive: {exc}") from exc
            cache_path.parent.mkdir(parents=True, exist_ok=True)
            cache_path.write_bytes(data)

        def progress(index, total, found):
            if index % 50 == 0 or index == total:
                self.stdout.write(f"  [{index}/{total}] monthly files read; {found} certificates.")

        try:
            certificates, unreadable = parse_archive(
                data, brand=options["brand"], progress=progress
            )
        except Exception as exc:
            raise CommandError(f"Could not read the MOEA archive: {exc}") from exc

        retrieved_at = retrieval_timestamp()
        output_path = output_dir / "taiwan_fuel_economy_certificates.csv"
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with output_path.open("w", encoding="utf-8-sig", newline="") as output:
            writer = csv.DictWriter(output, fieldnames=FIELDS)
            writer.writeheader()
            writer.writerows(
                {**item.as_row(), "retrieved_at": retrieved_at} for item in certificates
            )

        codes = sorted({item.model_code for item in certificates})
        years = sorted({item.issue_date[:4] for item in certificates})
        self.stdout.write(
            self.style.SUCCESS(
                f"Wrote {len(certificates)} certificates covering {len(codes)} model codes"
                + (f", {years[0]}-{years[-1]}." if years else ".")
            )
        )
        for name in unreadable:
            self.stderr.write(f"  could not decode: {name}")
        self.stdout.write(
            "The archive starts in ROC 106 (2017), so it cannot speak about the older "
            "Australian books; a certificate date is an observed date for a core code."
        )
        self.stdout.write(str(output_path))
