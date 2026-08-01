"""Build a reviewable technical-equivalence report for SYM parts books."""

from __future__ import annotations

import csv
from datetime import datetime, timezone
from html import escape
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from parts.ingestion.technical_equivalence import (
    BookFingerprint,
    DEFAULT_DELAY_SECONDS,
    compact_part_number,
    local_document_frequency,
    normalise_name,
    score_fingerprints,
    scrape_bike_parts_catalogue,
)
from parts.models import PartSection, PartsModel, SectionPart


LOCAL_FIELDS = [
    "left_model_name", "left_model_code", "right_model_name", "right_model_code",
    "shared_part_count", "left_part_count", "right_part_count", "left_overlap_percent",
    "right_overlap_percent", "weighted_jaccard_percent", "review_note",
]
EXTERNAL_FIELDS = [
    "local_model_name", "local_model_code", "external_title", "external_model_code",
    "external_years", "external_source_url", "sampled_sections", "total_sections",
    "shared_part_count", "local_part_count", "external_part_count", "local_overlap_percent",
    "external_overlap_percent", "weighted_jaccard_percent", "review_note",
]
CANDIDATE_FIELDS = [
    "local_model_name", "local_model_code", "external_title", "external_model_code",
    "external_years", "external_source_url", "candidate_reason",
]


def _write_csv(path, fields, rows):
    with path.open("w", encoding="utf-8-sig", newline="") as output:
        writer = csv.DictWriter(output, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


def _local_fingerprints(models):
    fingerprints = []
    for model in models:
        parts = {
            compact_part_number(part_number)
            for part_number in SectionPart.objects.filter(section__parts_model=model)
            .values_list("part__part_number", flat=True)
        }
        fingerprints.append(
            BookFingerprint(
                code=model.model_code,
                label=model.name,
                part_numbers=frozenset(part for part in parts if part),
                section_names=frozenset(
                    name
                    for name in PartSection.objects.filter(parts_model=model)
                    .values_list("name", flat=True)
                    if name
                ),
            )
        )
    return fingerprints


def _common_prefix_length(left, right):
    length = 0
    for left_char, right_char in zip(left, right):
        if left_char != right_char:
            break
        length += 1
    return length


def _bike_parts_candidates(claims_path, models):
    if not claims_path.exists():
        return []
    grouped = {}
    with claims_path.open(encoding="utf-8-sig", newline="") as source:
        for row in csv.DictReader(source):
            if row.get("source") != "bike-parts-sym.nl" or not row.get("source_url"):
                continue
            # Year pages normally repeat the same technical catalogue.  Keep a
            # single representative URL per code and aggregate its observed
            # years, otherwise a comparison would crawl the same book many
            # times.
            key = row["model_code"]
            existing = grouped.setdefault(key, {**row, "years": set()})
            for year in (row.get("year_from"), row.get("year_to")):
                if str(year).isdigit():
                    existing["years"].add(int(year))

    candidates = []
    for model in models:
        local_code = model.model_code.upper().split("-", 1)[0]
        local_name = normalise_name(model.name)
        for row in grouped.values():
            source_code = row["model_code"].upper().split("-", 1)[0]
            source_name = normalise_name(row.get("source_title"))
            prefix = _common_prefix_length(local_code, source_code)
            name_match = (
                len(local_name) >= 6
                and (local_name in source_name or source_name.startswith(local_name))
            )
            if prefix < 5 and not name_match:
                continue
            years = sorted(row["years"])
            candidates.append(
                {
                    "local_model_name": model.name,
                    "local_model_code": model.model_code,
                    "external_title": row.get("source_title", ""),
                    "external_model_code": row["model_code"],
                    "external_years": (
                        str(years[0]) if len(years) == 1 else f"{years[0]}-{years[-1]}"
                    ) if years else "",
                    "external_source_url": row["source_url"],
                    "candidate_reason": (
                        f"{prefix}-character technical-code prefix"
                        if prefix >= 5 else "recognisable model-name match"
                    ),
                }
            )
    return sorted(candidates, key=lambda row: (row["local_model_code"], row["external_model_code"], row["external_source_url"]))


def _render_html(local_rows, external_rows, generated_at):
    def table(rows, fields):
        if not rows:
            return "<p>No rows.</p>"
        header = "".join(f"<th>{escape(field.replace('_', ' '))}</th>" for field in fields)
        body = "".join(
            "<tr>" + "".join(
                f"<td>{escape(str(row.get(field, '')))}</td>" for field in fields
            ) + "</tr>"
            for row in rows
        )
        return f"<div class='wrap'><table><thead><tr>{header}</tr></thead><tbody>{body}</tbody></table></div>"

    return f"""<!doctype html><html lang='en'><head><meta charset='utf-8'>
<meta name='viewport' content='width=device-width,initial-scale=1'>
<title>SYM technical-equivalence review</title><style>
body{{margin:0;background:#f3f6f8;color:#17202a;font:14px/1.45 Arial,sans-serif}}header{{padding:24px 28px;background:#132f43;color:white}}h1{{margin:0 0 5px}}main{{padding:20px 28px}}.note{{background:#fff5d9;border-left:4px solid #c88600;padding:12px 14px}}.wrap{{overflow:auto;background:#fff;border:1px solid #d9e0e6}}table{{border-collapse:collapse;width:100%}}th{{background:#e7eef3;position:sticky;top:0}}th,td{{padding:8px;border:1px solid #d9e0e6;text-align:left;vertical-align:top}}h2{{margin-top:28px}}</style></head><body>
<header><h1>SYM technical-equivalence review</h1><p>Generated {generated_at}. Technical similarity is not year proof.</p></header><main>
<p class='note'>A high score means two books share distinctive OEM part numbers. It can support a bridge from a dated external book to a local book, but it must be reviewed with the source year evidence before it affects customer fitment.</p>
<h2>Local-book comparisons</h2>{table(local_rows, LOCAL_FIELDS)}
<h2>External catalogue comparisons</h2>{table(external_rows, EXTERNAL_FIELDS)}</main></body></html>"""


class Command(BaseCommand):
    help = "Compare local SYM parts books and optional sampled Bike-Parts-SYM catalogues."

    def add_arguments(self, parser):
        default_dir = Path(settings.BASE_DIR) / "data_management" / "data" / "sym_model_years"
        parser.add_argument("--output-dir", type=Path, default=default_dir)
        parser.add_argument("--model-code", action="append", dest="model_codes")
        parser.add_argument("--include-external", action="store_true")
        parser.add_argument("--max-sections", type=int, default=8)
        parser.add_argument("--external-limit-per-book", type=int, default=2)
        parser.add_argument("--delay", type=float, default=DEFAULT_DELAY_SECONDS)
        parser.add_argument("--minimum-score", type=float, default=5.0)

    def handle(self, *args, **options):
        if options["max_sections"] < 1:
            raise CommandError("--max-sections must be at least 1.")
        if options["external_limit_per_book"] < 1:
            raise CommandError("--external-limit-per-book must be at least 1.")
        if options["delay"] < DEFAULT_DELAY_SECONDS:
            raise CommandError(f"--delay must be at least {DEFAULT_DELAY_SECONDS} seconds.")
        output_dir = options["output_dir"]
        output_dir.mkdir(parents=True, exist_ok=True)
        models = list(PartsModel.objects.filter(is_active=True).order_by("model_code"))
        fingerprints = _local_fingerprints(models)
        frequency = local_document_frequency(fingerprints)
        local_rows = []
        for index, left in enumerate(fingerprints):
            for right in fingerprints[index + 1 :]:
                score = score_fingerprints(left, right, document_frequency=frequency, book_count=len(fingerprints))
                if score.weighted_jaccard_percent < options["minimum_score"] or score.shared_part_count < 5:
                    continue
                local_rows.append(
                    {
                        "left_model_name": left.label, "left_model_code": left.code,
                        "right_model_name": right.label, "right_model_code": right.code,
                        "shared_part_count": score.shared_part_count,
                        "left_part_count": score.left_part_count, "right_part_count": score.right_part_count,
                        "left_overlap_percent": score.left_overlap_percent,
                        "right_overlap_percent": score.right_overlap_percent,
                        "weighted_jaccard_percent": score.weighted_jaccard_percent,
                        "review_note": "Local-to-local technical similarity only; no year evidence added.",
                    }
                )
        local_rows.sort(key=lambda row: (-row["weighted_jaccard_percent"], -row["shared_part_count"]))
        candidates = _bike_parts_candidates(output_dir / "all_source_claims.csv", models)
        selected_codes = {code.upper() for code in (options["model_codes"] or [])}
        if selected_codes:
            candidates = [row for row in candidates if row["local_model_code"].upper() in selected_codes]
        _write_csv(output_dir / "technical_equivalence_candidates.csv", CANDIDATE_FIELDS, candidates)

        external_rows = []
        if options["include_external"]:
            by_code = {fingerprint.code.upper(): fingerprint for fingerprint in fingerprints}
            external_candidates = []
            for local_code in sorted({row["local_model_code"] for row in candidates}):
                matching = [row for row in candidates if row["local_model_code"] == local_code]
                matching.sort(
                    key=lambda row: (
                        -(
                            int(row["external_years"].split("-")[-1])
                            - int(row["external_years"].split("-")[0])
                            if row["external_years"] else 0
                        ),
                        row["external_model_code"],
                    )
                )
                external_candidates.extend(matching[: options["external_limit_per_book"]])
            for candidate in external_candidates:
                local = by_code[candidate["local_model_code"].upper()]
                self.stdout.write(f"Sampling {candidate['external_model_code']} for {local.code}...")
                try:
                    remote = scrape_bike_parts_catalogue(
                        candidate["external_source_url"],
                        cache_dir=output_dir / "cache" / "technical-equivalence",
                        maximum_sections=options["max_sections"],
                        delay_seconds=options["delay"],
                    )
                except Exception as exc:
                    self.stderr.write(f"Could not sample {candidate['external_model_code']}: {exc}")
                    external_rows.append(
                        {
                            "local_model_name": local.label, "local_model_code": local.code,
                            "external_title": candidate["external_title"],
                            "external_model_code": candidate["external_model_code"],
                            "external_years": candidate["external_years"],
                            "external_source_url": candidate["external_source_url"],
                            "sampled_sections": "", "total_sections": "", "shared_part_count": "",
                            "local_part_count": len(local.part_numbers), "external_part_count": "",
                            "local_overlap_percent": "", "external_overlap_percent": "",
                            "weighted_jaccard_percent": 0,
                            "review_note": f"Sampling failed; retry later from cache. {type(exc).__name__}: {exc}",
                        }
                    )
                    continue
                score = score_fingerprints(local, remote, document_frequency=frequency, book_count=len(fingerprints))
                external_rows.append(
                    {
                        "local_model_name": local.label, "local_model_code": local.code,
                        "external_title": candidate["external_title"],
                        "external_model_code": candidate["external_model_code"],
                        "external_years": candidate["external_years"],
                        "external_source_url": candidate["external_source_url"],
                        "sampled_sections": remote.sampled_sections, "total_sections": remote.total_sections,
                        "shared_part_count": score.shared_part_count,
                        "local_part_count": score.left_part_count, "external_part_count": score.right_part_count,
                        "local_overlap_percent": score.left_overlap_percent,
                        "external_overlap_percent": score.right_overlap_percent,
                        "weighted_jaccard_percent": score.weighted_jaccard_percent,
                        "review_note": (
                            "Partial sampled catalogue: do not promote to year evidence without full-book review."
                            if remote.sampled_sections < remote.total_sections else
                            "Full catalogue captured: technical similarity still requires year-evidence review."
                        ),
                    }
                )
        external_rows.sort(key=lambda row: (-row["weighted_jaccard_percent"], -row["shared_part_count"]))
        _write_csv(output_dir / "technical_equivalence_local_pairs.csv", LOCAL_FIELDS, local_rows)
        _write_csv(output_dir / "technical_equivalence_external_pairs.csv", EXTERNAL_FIELDS, external_rows)
        generated_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
        (output_dir / "technical_equivalence_review.html").write_text(
            _render_html(local_rows, external_rows, generated_at), encoding="utf-8"
        )
        self.stdout.write(self.style.SUCCESS(
            f"Wrote {len(local_rows)} local comparisons, {len(candidates)} external candidates and {len(external_rows)} sampled external comparisons."
        ))
