import collections
import csv
import time
from html import escape
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from parts.ingestion.rvcs_approvals import DEFAULT_DELAY_SECONDS, build_session
from parts.ingestion.rvcs_documents import (
    accepted_vin_model_year,
    extract_pdf_text,
    parse_approval_document,
)
from parts.ingestion.sym_model_years import retrieval_timestamp


FIELDS = [
    "approval_number",
    "document_date",
    "issue_date",
    "make",
    "model",
    "category",
    "manufactured_by",
    "typical_vin",
    "vin_model_year",
    "expiry",
    "plate_location",
    "printed_model_codes",
    "adr_items",
    "document_url",
    "has_text_layer",
    "retrieved_at",
]


def _read(path):
    if not path.exists():
        raise CommandError(
            f"{path} does not exist. Run scrape_rvcs_approvals first."
        )
    with path.open(encoding="utf-8-sig", newline="") as source:
        return list(csv.DictReader(source))


def _cached_get(session, url, cache_path, *, delay_seconds, timeout):
    """Fetch a document once and keep it; approval PDFs never change in place."""
    if cache_path.exists():
        return cache_path.read_bytes(), False
    response = session.get(url, timeout=timeout)
    response.raise_for_status()
    if cache_path.suffix.casefold() == ".pdf" and not response.content.startswith(b"%PDF"):
        # An error page served with a .pdf name must not be cached, or the
        # failure becomes permanent and silently reads as "no text layer".
        raise ValueError(f"response was not a PDF ({response.content[:16]!r})")
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    cache_path.write_bytes(response.content)
    if delay_seconds:
        time.sleep(delay_seconds)
    return response.content, True


def _contact_sheet(images, *, generated_at):
    """Build a review page for the plate images.

    No OCR engine is available here, so these are presented for human reading
    rather than mined.  A compliance plate is where a full suffixed local code
    would appear if it appears anywhere.
    """
    cards = "".join(
        f'<figure><a href="{escape(item["url"])}" target="_blank" rel="noopener noreferrer">'
        f'<img src="{escape(item["local"])}" loading="lazy" alt=""></a>'
        f'<figcaption><b>{escape(item["model"])}</b><br>approval {escape(item["approval"])}'
        f' — RVD {escape(item["reference"])}<br>{escape(item["issue_date"])}</figcaption></figure>'
        for item in images
    )
    return f"""<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>RVCS plate and vehicle images</title><style>
*{{box-sizing:border-box}}body{{margin:0;background:#f3f6f8;color:#17202a;font:14px/1.45 Arial,sans-serif}}
header{{padding:22px 26px;background:#132f43;color:#fff}}h1{{margin:0 0 5px}}header p{{margin:0;color:#dce8ef;max-width:70ch}}
.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;padding:20px}}
figure{{margin:0;background:#fff;border:1px solid #d9e0e6;border-radius:6px;overflow:hidden}}
img{{width:100%;height:200px;object-fit:contain;background:#eef2f5;display:block}}
figcaption{{padding:9px 11px;font-size:12px;color:#425263}}a{{color:#1261a0}}
</style></head><body><header><h1>RVCS plate and vehicle images</h1>
<p>Generated {escape(generated_at)}. {len(images)} images attached to Australian Road Vehicle
Descriptors. No OCR engine is available in this project, so these are for manual review: a
compliance plate is the most likely place for a full suffixed local code to be printed.</p></header>
<div class="grid">{cards}</div></body></html>"""


class Command(BaseCommand):
    help = "Download and read the approval PDFs and plate images attached to RVCS approvals."

    def add_arguments(self, parser):
        default_dir = Path(settings.BASE_DIR) / "data_management" / "data" / "sym_model_years"
        parser.add_argument("--input-dir", type=Path, default=default_dir)
        parser.add_argument("--output-dir", type=Path, default=default_dir)
        parser.add_argument("--delay", type=float, default=DEFAULT_DELAY_SECONDS)
        parser.add_argument("--skip-images", action="store_true")

    def handle(self, *args, **options):
        if options["delay"] < 0.5:
            raise CommandError("--delay must be at least 0.5 seconds.")
        input_dir, output_dir = options["input_dir"], options["output_dir"]
        cache_dir = output_dir / "cache" / "rvcs"
        session = build_session()
        session.headers.pop("Content-Type", None)

        approvals = _read(input_dir / "rvcs_approvals.csv")
        jobs = [
            (row["approval_number"], *entry.split(" ", 1))
            for row in approvals
            for entry in row["approval_documents"].split(" | ")
            if entry
        ]
        self.stdout.write(f"Reading {len(jobs)} approval documents...")

        documents, downloaded, no_text = [], 0, 0
        for index, (approval, document_date, url) in enumerate(jobs, start=1):
            name = url.rsplit("/", 1)[-1] or f"{approval}-{document_date}.pdf"
            try:
                data, fetched = _cached_get(
                    session, url, cache_dir / "approvals" / f"{approval}-{name}",
                    delay_seconds=options["delay"], timeout=120,
                )
            except Exception as exc:
                self.stderr.write(f"  [{index}/{len(jobs)}] {approval} {name}: {exc}")
                continue
            downloaded += fetched
            text = extract_pdf_text(data)
            if not text.strip():
                no_text += 1
            document = parse_approval_document(
                text, approval_number=approval, document_date=document_date, document_url=url
            )
            documents.append(document)
            if index % 25 == 0 or index == len(jobs):
                self.stdout.write(f"  [{index}/{len(jobs)}] read; {downloaded} newly downloaded.")

        retrieved_at = retrieval_timestamp()
        documents_path = output_dir / "rvcs_approval_document_evidence.csv"
        with documents_path.open("w", encoding="utf-8-sig", newline="") as output:
            writer = csv.DictWriter(output, fieldnames=FIELDS)
            writer.writeheader()
            writer.writerows(
                {**document.as_row(), "retrieved_at": retrieved_at} for document in documents
            )

        image_path = None
        if not options["skip_images"]:
            rvds = _read(input_dir / "rvcs_rvd_evidence.csv")
            images = []
            for row in rvds:
                for url in row["image_urls"].split(" | "):
                    if not url:
                        continue
                    name = url.rsplit("/", 1)[-1]
                    local = cache_dir / "images" / name
                    try:
                        _cached_get(
                            session, url, local, delay_seconds=options["delay"], timeout=120
                        )
                    except Exception as exc:
                        self.stderr.write(f"  image {name}: {exc}")
                        continue
                    images.append(
                        {
                            "url": url,
                            "local": f"cache/rvcs/images/{name}",
                            "model": f"{row['vehicle_model']} — {row['marketing_designation']}",
                            "approval": row["approval_number"],
                            "reference": row["reference"],
                            "issue_date": row["issue_date"],
                        }
                    )
            image_path = output_dir / "rvcs_plate_images.html"
            image_path.write_text(
                _contact_sheet(images, generated_at=retrieved_at), encoding="utf-8"
            )
            self.stdout.write(f"Catalogued {len(images)} plate/vehicle images for manual review.")

        # A typical VIN is one template per approval, repeated across its
        # documents, so its year is validated and reported once per approval.
        vin_groups = {}
        for document in documents:
            if not document.typical_vin:
                continue
            key = (document.approval_number, document.typical_vin)
            group = vin_groups.setdefault(
                key, {"model": document.model, "make": document.make, "years": []}
            )
            if document.issue_date:
                group["years"].append(int(document.issue_date[:4]))
        vin_rows, rejected = [], collections.Counter()
        for (approval, vin), group in sorted(vin_groups.items()):
            year, reason = accepted_vin_model_year(vin, group["years"])
            if reason:
                rejected[reason.split(",")[0].split(" so ")[0][:60]] += 1
            vin_rows.append(
                {
                    "approval_number": approval,
                    "make": group["make"],
                    "model": group["model"],
                    "typical_vin": vin,
                    "vin_model_year": year or "",
                    "rejected_reason": reason,
                    "document_years": " | ".join(str(y) for y in sorted(set(group["years"]))),
                    "retrieved_at": retrieved_at,
                }
            )
        vin_path = output_dir / "rvcs_vin_model_years.csv"
        with vin_path.open("w", encoding="utf-8-sig", newline="") as output:
            writer = csv.DictWriter(
                output,
                fieldnames=[
                    "approval_number", "make", "model", "typical_vin",
                    "vin_model_year", "rejected_reason", "document_years", "retrieved_at",
                ],
            )
            writer.writeheader()
            writer.writerows(vin_rows)

        accepted = [row for row in vin_rows if row["vin_model_year"]]
        self.stdout.write(
            f"Typical VINs: {len(vin_rows)} templates, {len(accepted)} yield a validated model year."
        )
        for reason, count in rejected.most_common():
            self.stdout.write(f"  rejected x{count}: {reason}")
        self.stdout.write(str(vin_path))

        dated = [d for d in documents if d.vin_model_year]
        suffixed = sorted(
            {
                code
                for d in documents
                for code in d.printed_model_codes.split(" | ")
                if "-" in code
            }
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"Read {len(documents)} approval documents; {len(dated)} carry a decodable "
                f"VIN model year; {no_text} had no text layer (would need OCR)."
            )
        )
        self.stdout.write(f"Suffixed codes printed by approval documents: {', '.join(suffixed) or 'none'}")
        self.stdout.write(str(documents_path))
        if image_path:
            self.stdout.write(str(image_path))
