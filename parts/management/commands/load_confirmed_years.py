import csv
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from parts.models import PartsModel


class Command(BaseCommand):
    help = (
        "Copy directly-evidenced years from the research coverage report onto "
        "PartsModel, so the VIN lookup can show them against each candidate book."
    )

    def add_arguments(self, parser):
        default = (
            Path(settings.BASE_DIR)
            / "data_management"
            / "data"
            / "sym_model_years"
            / "local_book_year_coverage.csv"
        )
        parser.add_argument("--coverage-file", type=Path, default=default)
        parser.add_argument("--dry-run", action="store_true")

    def handle(self, *args, **options):
        path = options["coverage_file"]
        if not path.exists():
            raise CommandError(
                f"{path} does not exist. Run build_sym_evidence_table first."
            )
        with path.open(encoding="utf-8-sig", newline="") as handle:
            rows = list(csv.DictReader(handle))

        # Only the directly-evidenced years travel to the customer-facing side.
        # Family-code years describe relatives of this book and would read as a
        # fitment claim if shown against it.
        years_by_code = {
            (row["local_model_code"] or "").strip().upper(): (row["observed_years"] or "").strip()
            for row in rows
        }

        updated, cleared, unknown = 0, 0, []
        for model in PartsModel.objects.all():
            code = model.model_code.strip().upper()
            if code not in years_by_code:
                unknown.append(model.model_code)
                continue
            years = years_by_code[code]
            if model.confirmed_years == years:
                continue
            model.confirmed_years = years
            if not options["dry_run"]:
                model.save(update_fields=["confirmed_years"])
            if years:
                updated += 1
            else:
                cleared += 1

        verb = "Would set" if options["dry_run"] else "Set"
        self.stdout.write(
            self.style.SUCCESS(
                f"{verb} confirmed years on {updated} books; {cleared} left blank."
            )
        )
        if unknown:
            self.stdout.write(
                f"{len(unknown)} books are not in the coverage report and were skipped: "
                + ", ".join(sorted(unknown)[:10])
                + ("..." if len(unknown) > 10 else "")
            )
