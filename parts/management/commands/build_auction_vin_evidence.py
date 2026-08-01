import csv
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from parts.ingestion.auction_vins import (
    confusable_families,
    position_9_by_family,
    read_observation,
)
from parts.ingestion.sym_model_years import retrieval_timestamp


FIELDS = [
    "source",
    "listing_title",
    "listed_year",
    "vin_prefix",
    "wmi",
    "model_family",
    "position_9",
    "position_11",
    "decoded_year",
    "year_agrees",
    "engine_number",
    "candidate_local_books",
    "source_url",
    "notes",
    "problem",
    "retrieved_at",
]


def _read(path):
    if not path.exists():
        raise CommandError(f"Required input does not exist: {path}")
    with path.open(encoding="utf-8-sig", newline="") as source:
        return list(csv.DictReader(source))


def _candidates(model_family, local_codes):
    """Match a VIN family to local books by shared code prefix.

    Matching stops at the family, never the revision digit, because the RFG
    VIN does not carry one — so several books legitimately share one family
    and all of them are returned.
    """
    if not model_family:
        return []
    matches = []
    for code in local_codes:
        core = code.split("-")[0]
        if model_family.startswith(core) or core.startswith(model_family[:5]):
            matches.append(code)
    return sorted(matches)


class Command(BaseCommand):
    help = "Decode real Australian SYM VINs harvested from vehicle auction listings."

    def add_arguments(self, parser):
        default_dir = Path(settings.BASE_DIR) / "data_management" / "data" / "sym_model_years"
        parser.add_argument("--input-dir", type=Path, default=default_dir)
        parser.add_argument("--output-dir", type=Path, default=default_dir)

    def handle(self, *args, **options):
        from parts.models import PartsModel

        rows = _read(options["input_dir"] / "auction_vin_observations.csv")
        records = [read_observation(row) for row in rows]
        local_codes = list(
            PartsModel.objects.filter(is_active=True).values_list("model_code", flat=True)
        )

        retrieved_at = retrieval_timestamp()
        output_path = options["output_dir"] / "auction_vin_evidence.csv"
        with output_path.open("w", encoding="utf-8-sig", newline="") as output:
            writer = csv.DictWriter(output, fieldnames=FIELDS)
            writer.writeheader()
            for record in records:
                writer.writerow(
                    {
                        **record.as_row(),
                        "candidate_local_books": " | ".join(
                            _candidates(record.model_family, local_codes)
                        ),
                        "retrieved_at": retrieved_at,
                    }
                )

        good = [r for r in records if not r.problem]
        dated = [r for r in good if r.decoded_year]
        checked = [r for r in good if r.year_agrees]
        agree = [r for r in checked if r.year_agrees == "exact"]
        books = sorted({b for r in good for b in _candidates(r.model_family, local_codes)})

        self.stdout.write(
            self.style.SUCCESS(
                f"Read {len(records)} auction observations; {len(good)} usable VINs, "
                f"{len(dated)} decoded a model year, touching {len(books)} local books."
            )
        )
        if checked:
            self.stdout.write(
                f"Year cross-check against the listing's own stated year: "
                f"{len(agree)}/{len(checked)} exact."
            )
        for record in records:
            if record.problem:
                self.stderr.write(f"  unusable: {record.listing_title[:44]} — {record.problem}")
        confusable = confusable_families(good)
        if confusable:
            self.stdout.write(
                "S/5 confusion at position 11 in: " + ", ".join(confusable)
                + " (likely one transcription fault, not two variants)"
            )
        self.stdout.write("Position 9 observed per family:")
        for family, chars in position_9_by_family(good).items():
            flag = "  <- varies" if len(chars) > 1 else ""
            self.stdout.write(f"  {family:<8} {', '.join(chars)}{flag}")
        self.stdout.write(str(output_path))
