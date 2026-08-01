import csv
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from parts.ingestion.rvcs_approvals import (
    DEFAULT_DELAY_SECONDS,
    SYM_MAKES,
    administrative_status_dates,
    build_session,
    collect_sym_records,
)
from parts.ingestion.sym_model_years import retrieval_timestamp


APPROVAL_FIELDS = [
    "approval_number",
    "make",
    "marketing_model",
    "certification_model",
    "licensee",
    "approval_status",
    "approval_status_date",
    "approval_status_is_administrative",
    "last_approval_date",
    "build_volume",
    "document_title",
    "approval_documents",
    "rvd_documents",
    "source_url",
    "retrieved_at",
]

RVD_FIELDS = [
    "approval_number",
    "rvd_id",
    "reference",
    "issue_date",
    "rvd_status",
    "vehicle_make",
    "vehicle_model",
    "marketing_designation",
    "body_type",
    "vehicle_category",
    "licensee",
    "variant_names",
    "vin_patterns",
    "printed_model_codes",
    "remarks",
    "image_urls",
    "source_url",
    "retrieved_at",
]


def _write_csv(path, fields, rows):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as output:
        writer = csv.DictWriter(output, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


class Command(BaseCommand):
    help = (
        "Enumerate every SYM/Bolwell approval and Road Vehicle Descriptor from the "
        "public Australian RVCS API, replacing hand-curated government evidence."
    )

    def add_arguments(self, parser):
        default_dir = Path(settings.BASE_DIR) / "data_management" / "data" / "sym_model_years"
        parser.add_argument("--output-dir", type=Path, default=default_dir)
        parser.add_argument("--delay", type=float, default=DEFAULT_DELAY_SECONDS)
        parser.add_argument(
            "--make",
            action="append",
            dest="makes",
            help="Override the makes to enumerate (repeatable). Defaults to SYM and BOLWELL.",
        )

    def handle(self, *args, **options):
        if options["delay"] < 0.5:
            raise CommandError("--delay must be at least 0.5 seconds.")
        makes = tuple(options["makes"] or SYM_MAKES)
        self.stdout.write(f"Enumerating RVCS approvals for makes: {', '.join(makes)}...")

        def progress(index, total, approval, rvd_count):
            self.stdout.write(
                f"  [{index}/{total}] approval {approval.approval_number} "
                f"{approval.certification_model or '(no certification model)'} — "
                f"{approval.marketing_model[:40]} ({len(approval.rvd_documents)} RVDs, "
                f"{len(approval.approval_documents)} approval PDFs; {rvd_count} RVDs read)"
            )

        try:
            approvals, rvds = collect_sym_records(
                build_session(), makes=makes, delay_seconds=options["delay"], progress=progress
            )
        except Exception as exc:
            raise CommandError(f"Could not enumerate the RVCS corpus: {exc}") from exc

        # A lapse date shared across unrelated approvals is the 1989 Act being
        # retired, not a model going out of supply.  Mark it so no downstream
        # step can mistake it for an end-of-production boundary.
        administrative = administrative_status_dates(approvals)
        retrieved_at = retrieval_timestamp()
        output_dir = options["output_dir"]
        approvals_path = output_dir / "rvcs_approvals.csv"
        rvds_path = output_dir / "rvcs_rvd_evidence.csv"

        _write_csv(
            approvals_path,
            APPROVAL_FIELDS,
            [
                {
                    **approval.as_row(),
                    "approval_status_is_administrative": str(
                        approval.approval_status_date in administrative
                    ).lower(),
                    "retrieved_at": retrieved_at,
                }
                for approval in approvals
            ],
        )
        _write_csv(
            rvds_path,
            RVD_FIELDS,
            [{**rvd.as_row(), "retrieved_at": retrieved_at} for rvd in rvds],
        )

        suffixed = sorted(
            {
                code
                for rvd in rvds
                for code in rvd.printed_model_codes.split(" | ")
                if "-" in code
            }
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"Wrote {len(approvals)} approvals and {len(rvds)} Road Vehicle Descriptors."
            )
        )
        self.stdout.write(
            f"Administrative (bulk) status dates ignored as evidence: "
            f"{', '.join(sorted(administrative)) or 'none'}"
        )
        self.stdout.write(f"Full suffixed model codes printed by RVDs: {', '.join(suffixed) or 'none'}")
        self.stdout.write(str(approvals_path))
        self.stdout.write(str(rvds_path))
