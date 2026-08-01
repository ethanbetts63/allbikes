import csv
import re
from datetime import datetime, timezone
from html import escape
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from parts.ingestion.evidence_matrix import (
    MATRIX_FIELDS,
    annotate_generation_years,
    build_matrix,
    code_stem,
    render_matrix_html,
)
from parts.ingestion.rvcs_approvals import variant_model_codes, vin_family
from parts.models import PartsModel


RAW_FIELDS = [
    "source",
    "source_record_id",
    "source_title",
    "model_code",
    "code_stem",
    "year_from",
    "year_to",
    "range_is_open",
    "engine",
    "generation",
    "generation_year_from",
    "generation_year_to",
    "generation_year_check",
    "year_evidence",
    "frame_number",
    "variant",
    "source_url",
    "retrieved_at",
    "document_type",
    "evidence_authority",
    "evidence_notes",
]


def _read(path):
    if not path.exists():
        raise CommandError(f"Required source report does not exist: {path}")
    with path.open(encoding="utf-8-sig", newline="") as source:
        return list(csv.DictReader(source))


def _integer(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


RVCS_SOURCE = "mvsa.infrastructure.gov.au"


def _rvcs_claims(input_dir):
    """Read the enumerated Australian RVCS corpus as dated identity claims.

    An RVD is a point-in-time approval record, so each one contributes the year
    it was issued and nothing more — never a production range.  One claim is
    emitted per technical code the record prints, because the certification
    model is usually a bare stem while the variant table names the series.
    """
    path = input_dir / "rvcs_rvd_evidence.csv"
    if not path.exists():
        return []
    claims = []
    for row in _read(path):
        year = _integer(row["issue_date"][:4])
        codes = sorted(
            {
                code
                for code in [row["vehicle_model"].strip().upper()]
                + variant_model_codes(row["variant_names"])
                + [c for c in row["printed_model_codes"].split(" | ") if c]
                if code
            }
        )
        families = sorted({vin_family(vin) for vin in row["vin_patterns"].split(" | ")} - {""})
        notes = [f"RVD {row['reference']} issued {row['issue_date']} under approval {row['approval_number']}"]
        if row["variant_names"]:
            notes.append(f"variants {row['variant_names']}")
        if families:
            notes.append(f"VIN family {', '.join(families)}")
        if row["rvd_status"]:
            notes.append(row["rvd_status"])
        if row["remarks"]:
            notes.append(row["remarks"])
        for code in codes or [""]:
            claims.append(
                {
                    "source": RVCS_SOURCE,
                    "source_record_id": f"rvd-{row['rvd_id']}",
                    "source_title": row["marketing_designation"] or row["vehicle_model"],
                    "model_code": code,
                    "year_from": year,
                    "year_to": year,
                    "range_is_open": False,
                    "engine": "",
                    "generation": "",
                    "frame_number": " | ".join(families),
                    "variant": row["variant_names"],
                    "source_url": row["source_url"],
                    "retrieved_at": row["retrieved_at"],
                    "document_type": "Road Vehicle Descriptor",
                    "evidence_authority": "Australian Government approval record",
                    "evidence_notes": "; ".join(notes),
                }
            )
    return claims


def _rvcs_vin_claims(input_dir):
    """Read validated typical-VIN model years from the approval PDFs.

    The approval search summaries mask position 10 of a typical VIN; the
    approval document prints it, and the descriptors state that it is the year
    of manufacture.  Each accepted template gives one Australian
    government-stated model year for its certification model.

    The code claimed is the VIN's own vehicle-descriptor section when the
    Schedule 2 model is a marketing name, so a book whose approval was filed
    under "SHARK 50" still links through ``BS05W``.
    """
    path = input_dir / "rvcs_vin_model_years.csv"
    if not path.exists():
        return []
    claims = []
    for row in _read(path):
        year = _integer(row["vin_model_year"])
        if year is None:
            continue
        model = row["model"].strip().upper()
        code = model if variant_model_codes(model) else vin_family(row["typical_vin"])
        if not code:
            continue
        claims.append(
            {
                "source": RVCS_SOURCE,
                "source_record_id": f"vin-{row['approval_number']}-{row['typical_vin']}",
                "source_title": row["model"] or code,
                "model_code": code,
                "year_from": year,
                "year_to": year,
                "range_is_open": False,
                "engine": "",
                "generation": "",
                "frame_number": vin_family(row["typical_vin"]),
                "variant": "",
                "source_url": (
                    f"https://mvsa.infrastructure.gov.au/rvcs/cert-unit/{row['approval_number']}"
                ),
                "retrieved_at": row["retrieved_at"],
                "document_type": "Approval document typical VIN",
                "evidence_authority": "Australian Government approval record",
                "evidence_notes": (
                    f"Approval {row['approval_number']} Schedule 2 typical VIN "
                    f"{row['typical_vin']}; position 10 decodes to model year {year}. "
                    f"Approval documents dated {row['document_years']}. One template per "
                    "approval, so this is a single observed year, not a range."
                ),
            }
        )
    return claims


def _taiwan_fuel_economy_claims(input_dir):
    """Read MOEA fuel-economy certificate dates as core-code observations.

    A certificate is issued on one date for one code, so it contributes that
    single year.  The archive begins in 2017 and prints Taiwan-domestic codes,
    so like the emissions register this is family evidence about recent models.
    """
    path = input_dir / "taiwan_fuel_economy_certificates.csv"
    if not path.exists():
        return []
    claims = []
    for row in _read(path):
        year = _integer(row["issue_date"][:4])
        if year is None:
            continue
        claims.append(
            {
                "source": "moeaea.gov.tw",
                "source_record_id": f"{row['model_code']}-{row['issue_date']}",
                "source_title": row["model_text"],
                "model_code": row["model_code"],
                "year_from": year,
                "year_to": year,
                "range_is_open": False,
                "engine": "",
                "generation": "",
                "frame_number": "",
                "variant": "",
                "source_url": row["source_url"],
                "retrieved_at": row["retrieved_at"],
                "document_type": "Fuel-economy certificate",
                "evidence_authority": "Taiwan Ministry of Economic Affairs register",
                "evidence_notes": (
                    f"Fuel-economy certificate issued {row['issue_date']} to "
                    f"{row['applicant']} for {row['model_text']} ({row['displacement_cc']}cc). "
                    "Archive starts in 2017 and prints Taiwan-domestic codes, so this is a "
                    "core-code observed date, not local parts-book confirmation."
                ),
            }
        )
    return claims


def _auction_vin_claims(input_dir):
    """Read real Australian VINs harvested from vehicle auction listings.

    These are actual bikes sold here, so unlike an approval template nothing is
    masked.  The VIN carries the model family and the year but never the
    parts-book revision digit, so each one is family evidence for its core
    code - the same standing as an RVD, from an independent source.
    """
    path = input_dir / "auction_vin_evidence.csv"
    if not path.exists():
        return []
    claims = []
    for row in _read(path):
        year = _integer(row["decoded_year"])
        family = row["model_family"].strip().upper()
        if year is None or not family or row["problem"]:
            continue
        # Position 9 belongs to the model code in some families (HV15W"C" is
        # the book HV15WC-8) and is a market/variant slot in others (LA18W"8"
        # against the book LA18W1-8).  Both readings are true statements about
        # the characters observed, so both are claimed and the matrix decides.
        codes = sorted({family, family[:5]})
        notes = [
            f"{row['source']} listing \"{row['listing_title']}\"; VIN {row['vin_prefix']}...; "
            f"position 10 decodes to {year}"
        ]
        if row["year_agrees"]:
            notes.append(f"listing's own stated year {row['listed_year']} ({row['year_agrees']})")
        if row["engine_number"]:
            notes.append(f"engine {row['engine_number']}")
        if row["notes"]:
            notes.append(row["notes"])
        for code in codes:
            claims.append(
                {
                "source": row["source"],
                "source_record_id": f"{row['vin_prefix']}-{code}",
                "source_title": row["listing_title"],
                "model_code": code,
                "year_from": year,
                "year_to": year,
                "range_is_open": False,
                "engine": row["engine_number"],
                "generation": "",
                "frame_number": row["model_family"],
                "variant": "",
                "source_url": row["source_url"],
                "retrieved_at": row["retrieved_at"],
                "document_type": "Auction listing VIN",
                "evidence_authority": "Observed Australian vehicle",
                "evidence_notes": "; ".join(notes),
                }
            )
    return claims


def _registration_claims(input_dir):
    """Read Australian registration extracts as observed model-year evidence.

    These are vehicles that were actually registered here, with a build year
    recorded by the registering authority - the most direct year evidence in
    the project for the Australian-only books.  One claim is emitted per
    observed year so a scatter of build years never becomes a continuous run.

    The link to a book is an inference: the extract exposes only two
    characters of the model code, so it is combined with the capacity in the
    recorded model name.  The claim is therefore made against the book's core
    code and lands as family evidence.
    """
    path = input_dir / "registration_year_evidence.csv"
    if not path.exists():
        return []
    claims = []
    for row in _read(path):
        books = [b for b in row["candidate_local_books"].split(" | ") if b]
        years = [_integer(y) for y in row["observed_years"].split(",")]
        years = [y for y in years if y]
        if not books or not years:
            continue
        cores = sorted({b.split("-")[0].upper() for b in books})
        for core in cores:
            for year in years:
                claims.append(
                    {
                        "source": "vehicle registration extract",
                        "source_record_id": f"{row['vin_prefix']}-{row['model']}-{year}",
                        "source_title": f"{row['make']} {row['model']}".strip(),
                        "model_code": core,
                        "year_from": year,
                        "year_to": year,
                        "range_is_open": False,
                        "engine": "",
                        "generation": "",
                        "frame_number": row["vin_prefix"],
                        "variant": "",
                        "source_url": "",
                        "retrieved_at": row["retrieved_at"],
                        "document_type": "State vehicle registration record",
                        "evidence_authority": "Registered Australian vehicle",
                        "evidence_notes": (
                            f"{row['registration_count']} {row['make']} {row['model']} "
                            f"registrations on VIN prefix {row['vin_prefix']}, build years "
                            f"{row['observed_years']}. Book matched on VIN prefix plus "
                            f"capacity, so this dates the model family, not the revision. "
                            f"Source: {row['source_files']}"
                        ),
                    }
                )
    return claims


def _taiwan_claims(input_dir):
    """Read Taiwan's emissions register as core-code model-year evidence.

    The model year is stated by SYM's home regulator, which makes it stronger
    than a retailer listing.  It is still core-code evidence: the register
    prints Taiwan-domestic codes, so a match informs the family and cannot
    confirm a suffixed local parts book.
    """
    path = input_dir / "taiwan_emissions_certifications.csv"
    if not path.exists():
        return []
    claims = []
    for row in _read(path):
        year = _integer(row["model_year"])
        if year is None:
            continue
        claims.append(
            {
                "source": "data.moenv.gov.tw",
                "source_record_id": f"{row['certificate_number']}-{row['model_code']}-{year}",
                "source_title": row["model_name"],
                "model_code": row["model_code"],
                "year_from": year,
                "year_to": year,
                "range_is_open": False,
                "engine": row["engine_family"],
                "generation": "",
                "frame_number": "",
                "variant": "",
                "source_url": row["source_url"],
                "retrieved_at": row["retrieved_at"],
                "document_type": "New-vehicle emissions type approval",
                "evidence_authority": "Taiwan Ministry of Environment register",
                "evidence_notes": (
                    f"Certificate {row['certificate_number']}; model year {year} stated by the "
                    f"register; {row['displacement_cc']}cc; engine family {row['engine_family']}. "
                    "Register covers only the standard in force from 2021-01-01 and prints "
                    "Taiwan-domestic codes, so this is core-code family evidence."
                ),
            }
        )
    return claims


def _claims(input_dir):
    claims = []
    for row in _read(input_dir / "bike_parts_sym_relationships.csv"):
        claims.append(
            {
                "source": "bike-parts-sym.nl",
                "source_record_id": row["catalog_id"],
                "source_title": row["source_title"],
                "model_code": row["model_code"],
                "year_from": _integer(row["year"]),
                "year_to": _integer(row["year"]),
                "range_is_open": False,
                "engine": "",
                "generation": row["code_qualifiers"],
                "frame_number": "",
                "variant": row["variant"],
                "source_url": row["source_url"],
                "retrieved_at": row["retrieved_at"],
            }
        )
    for row in _read(input_dir / "easyparts_sym_relationships.csv"):
        claims.append(
            {
                "source": "easyparts.com",
                "source_record_id": row["source_model_id"],
                "source_title": row["customer_name"],
                "model_code": row["model_code"],
                "year_from": _integer(row["year_from"]),
                "year_to": _integer(row["year_to"]),
                "range_is_open": False,
                "engine": row["engine"],
                "generation": row["generation"],
                "frame_number": row["frame_number"],
                "variant": "",
                "source_url": row["source_url"],
                "retrieved_at": row["retrieved_at"],
            }
        )
    for row in _read(input_dir / "racing_planet_sym_relationships.csv"):
        claims.append(
            {
                "source": "racing-planet.com",
                "source_record_id": row["selector_id"],
                "source_title": row["source_title"],
                "model_code": row["model_code"],
                "year_from": _integer(row["year_from"]),
                "year_to": _integer(row["year_to"]),
                "range_is_open": row["range_is_open"].casefold() == "true",
                "engine": "",
                "generation": "",
                "frame_number": "",
                "variant": "",
                "source_url": row["source_url"],
                "retrieved_at": row["retrieved_at"],
            }
        )
    oemmotorparts_path = input_dir / "oemmotorparts_sym_relationships.csv"
    if oemmotorparts_path.exists():
        for row in _read(oemmotorparts_path):
            claims.append(
                {
                    "source": "oemmotorparts.com",
                    "source_record_id": f"sym-index-{row['source_page']}",
                    "source_title": row["source_title"],
                    "model_code": row["model_code"],
                    "year_from": _integer(row["year_from"]),
                    "year_to": _integer(row["year_to"]),
                    "range_is_open": False,
                    "engine": "",
                    "generation": row["generation"],
                    "frame_number": "",
                    "variant": "",
                    "source_url": row["source_url"],
                    "retrieved_at": row["retrieved_at"],
                    "document_type": "Public OEM catalogue index",
                    "evidence_authority": "Third-party OEM parts catalogue",
                    "evidence_notes": "Exact model code is printed in the index title.",
                }
            )
    rvcs_claims = _rvcs_claims(input_dir)
    claims.extend(rvcs_claims)
    claims.extend(_rvcs_vin_claims(input_dir))
    claims.extend(_taiwan_claims(input_dir))
    claims.extend(_taiwan_fuel_economy_claims(input_dir))
    claims.extend(_auction_vin_claims(input_dir))
    claims.extend(_registration_claims(input_dir))
    for row in _read(input_dir / "document_evidence.csv"):
        # The enumerated RVCS corpus supersedes hand-transcribed government
        # rows: it is the same records read completely rather than selectively.
        # Everything else in this file (manuals, third-party documents) stays.
        if rvcs_claims and row["source"] == RVCS_SOURCE:
            continue
        claims.append(
            {
                "source": row["source"],
                "source_record_id": row["source_record_id"],
                "source_title": row["source_title"],
                "model_code": row["model_code"],
                "year_from": _integer(row["year_from"]),
                "year_to": _integer(row["year_to"]),
                "range_is_open": row["range_is_open"].casefold() == "true",
                "engine": row["engine"],
                "generation": row["generation"],
                "frame_number": row["frame_number"],
                "variant": row["variant"],
                "source_url": row["source_url"],
                "retrieved_at": row["retrieved_at"],
                "document_type": row["document_type"],
                "evidence_authority": row["evidence_authority"],
                "evidence_notes": row["evidence_notes"],
            }
        )
    return [annotate_generation_years(claim) for claim in claims]


COVERAGE_FIELDS = [
    "local_model_name",
    "local_model_code",
    "code_stem",
    "coverage_status",
    "year_confidence_score",
    "year_confidence_band",
    "warning_required",
    "year_evidence_shape",
    "observed_years",
    "earliest_confirmed_year",
    "latest_confirmed_year",
    "unevidenced_years",
    "inferred_year_range",
    "year_ranges",
    "known_family_code_years",
    "workbook_activity_years",
    "known_shared_family_code_variations",
    "open_range_evidence",
    "evidence_basis",
    "evidence_groups",
    "aggregated_evidence",
    "coverage_note",
]


EVIDENCE_COLUMNS = {
    "bike_parts_sym_evidence": "Bike-Parts-SYM",
    "easyparts_evidence": "EasyParts",
    "racing_planet_evidence": "Racing Planet",
    "official_sym_document_evidence": "Official SYM documents",
    "australian_rvcs_evidence": "Australian RVCS",
    "taiwan_register_evidence": "Taiwan emissions register",
    "third_party_document_evidence": "Other documents",
}


def _named_model_evidence(input_dir):
    """Return source-preserving, non-confirming retail-name evidence by book.

    These sources give a useful year range for a named/capacity-specific model,
    but do not print the local parts-book code.  They must remain visibly
    separate from code-level evidence so that they can only add *suspected*
    years, never turn a local book into a confirmed fitment range.
    """
    path = input_dir / "cestne_skutre_named_model_evidence.csv"
    if not path.exists():
        return {}
    evidence = {}
    with path.open(encoding="utf-8-sig", newline="") as source:
        for row in csv.DictReader(source):
            local_code = row.get("candidate_local_model_code", "").upper()
            if not local_code:
                continue
            year_from = _integer(row.get("year_from"))
            year_to = _integer(row.get("year_to"))
            if year_from is None:
                continue
            years = range(year_from, (year_to or year_from) + 1)
            evidence.setdefault(local_code, []).append(
                {
                    "years": set(years),
                    "range_is_open": row.get("range_is_open", "").casefold() == "true",
                    "summary": (
                        f"{row.get('source_title', 'Named model')} ({year_from}"
                        f"{'+' if row.get('range_is_open', '').casefold() == 'true' else f'-{year_to}' if year_to else ''})"
                        f" — {row.get('match_basis', '')}; {row.get('document_type', '')}; "
                        f"{row.get('evidence_authority', '')}; {row.get('evidence_notes', '')} "
                        f"{row.get('source_url', '')}"
                    ).strip(),
                }
            )
    return evidence


def _workbook_activity(input_dir):
    """Return dated workbook-maintenance activity by exact local code.

    This is deliberately kept out of the claim stream.  A revision date proves
    the book was live in the parts system that year, which is not the same as a
    vehicle being built or sold — and because the workbook declares the full
    local code, feeding it into the claims would silently promote document
    dates to confirmed supported years for half the library.
    """
    path = input_dir / "workbook_revision_evidence.csv"
    if not path.exists():
        return {}
    activity = {}
    for row in _read(path):
        code = row["declared_model_code"].strip().upper()
        if not code or not row["all_activity_years"]:
            continue
        activity[code] = {
            "years": row["all_activity_years"],
            "revision_count": row["revision_count"],
            "first": row["first_revision_date"],
            "last": row["last_revision_date"],
            "source_file": row["source_file"],
        }
    return activity


def _technical_equivalence_evidence(input_dir):
    """Return reviewed technical-comparison summaries by local parts-book code.

    These are deliberately displayed as supplementary evidence only.  Part
    overlap can bridge two catalogue revisions for later review, but never
    manufactures a year claim on its own.
    """
    path = input_dir / "technical_equivalence_external_pairs.csv"
    if not path.exists():
        return {}
    evidence = {}
    with path.open(encoding="utf-8-sig", newline="") as source:
        for row in csv.DictReader(source):
            local_code = row.get("local_model_code", "").upper()
            if not local_code or not row.get("shared_part_count"):
                continue
            try:
                overlap = float(row.get("weighted_jaccard_percent", 0))
            except ValueError:
                overlap = 0
            summary = (
                f"{row.get('external_model_code', 'external catalogue')} "
                f"({row.get('external_years', 'year unspecified')}): "
                f"{row.get('shared_part_count')} shared OEM parts; "
                f"weighted similarity {overlap:g}% across "
                f"{row.get('sampled_sections', '?')}/{row.get('total_sections', '?')} diagrams. "
                f"{row.get('external_source_url', '')}"
            )
            evidence.setdefault(local_code, []).append(summary)
    return {code: sorted(set(values)) for code, values in evidence.items()}


def _year_ranges(years):
    if not years:
        return ""
    ranges = []
    start = previous = years[0]
    for year in years[1:]:
        if year == previous + 1:
            previous = year
            continue
        ranges.append(str(start) if start == previous else f"{start}-{previous}")
        start = previous = year
    ranges.append(str(start) if start == previous else f"{start}-{previous}")
    return " | ".join(ranges)


def _year_list(years):
    """Render evidenced years one by one so gaps stay visible.

    A hyphenated span reads as a production run even when the underlying
    evidence is a handful of scattered observations, so anything weaker than a
    confirmed range is listed year by year instead of collapsed.
    """
    return ", ".join(str(year) for year in years)


def _year_evidence_shape(observed, *, open_range):
    """Describe what the confirmed years actually are, before anyone reads a range into them.

    ``year_from``/``year_to`` cannot distinguish one catalogue date from a
    documented production run, so the shape is stated explicitly and the
    unproven part of a gapped range is kept in its own ``inferred`` field.
    """
    if not observed:
        return {
            "year_evidence_shape": "no confirmed year evidence",
            "observed_years": "",
            "earliest_confirmed_year": "",
            "latest_confirmed_year": "",
            "unevidenced_years": "",
            "inferred_year_range": "",
        }
    earliest = observed[0]
    if open_range:
        # The source stopped at "from 2007", so there is no evidenced latest
        # year to report and the expanded years are an artefact, not evidence.
        return {
            "year_evidence_shape": f"open-ended source range from {earliest}",
            "observed_years": f"{earliest}+",
            "earliest_confirmed_year": earliest,
            "latest_confirmed_year": "",
            "unevidenced_years": "",
            "inferred_year_range": f"{earliest}+",
        }
    latest = observed[-1]
    evidenced = set(observed)
    unevidenced = [year for year in range(earliest, latest + 1) if year not in evidenced]
    if earliest == latest:
        shape = "single observed year"
    elif unevidenced:
        shape = "observed years with gaps"
    else:
        shape = "continuous evidenced range"
    return {
        "year_evidence_shape": shape,
        "observed_years": _year_list(observed),
        "earliest_confirmed_year": earliest,
        "latest_confirmed_year": latest,
        "unevidenced_years": _year_list(unevidenced),
        "inferred_year_range": f"{earliest}-{latest}" if unevidenced else "",
    }


def _name_key(value):
    value = re.sub(r"\b(?:19|20)\d{2}\b", "", value or "")
    return re.sub(r"[^a-z0-9]+", "", value.casefold())


def _is_related_evidence(row, model):
    """Find weaker family/name evidence without promoting it to confirmation."""
    evidence_key = row["evidence_key"]
    local_stem = code_stem(model.model_code)
    if evidence_key.startswith("NAME:"):
        local_name = _name_key(model.name)
        evidence_name = _name_key(evidence_key.removeprefix("NAME:"))
        broad_names = {"symphony", "classic", "orbit", "hd200"}
        return (
            len(local_name) >= 6
            and local_name not in broad_names
            and (local_name in evidence_name or evidence_name in local_name)
        )
    return (
        evidence_key != local_stem
        and min(len(evidence_key), len(local_stem)) >= 5
        and (local_stem.startswith(evidence_key) or evidence_key.startswith(local_stem))
    )


def _coverage_rows(matrix_rows, local_models, *, technical_evidence=None, named_model_evidence=None,
                   workbook_activity=None):
    technical_evidence = technical_evidence or {}
    named_model_evidence = named_model_evidence or {}
    workbook_activity = workbook_activity or {}
    coverage = []
    for model in local_models:
        marker = f"[{model.model_code}]"
        exact_rows = [row for row in matrix_rows if marker in row["local_exact_books"]]
        stem_rows = [row for row in matrix_rows if marker in row["local_same_stem_candidates"]]
        accepted_row_ids = {id(row) for row in exact_rows + stem_rows}
        related_rows = [
            row
            for row in matrix_rows
            if id(row) not in accepted_row_ids and _is_related_evidence(row, model)
        ]
        exact_years = {int(row["year"]) for row in exact_rows if row["year"].isdigit()}
        stem_years = {int(row["year"]) for row in stem_rows if row["year"].isdigit()}
        # A suffix can encode a market, homologation or revision difference.
        # It is useful fitment intelligence, but it cannot prove that this
        # local book applies.  Only an explicit full local-code claim earns a
        # confirmed year; core-code/suffix matches remain suspected.
        years = sorted(exact_years)
        local_core = code_stem(model.model_code)

        def has_related_family_code(row):
            return any(
                source_code
                and (
                    code_stem(source_code).startswith(local_core)
                    or local_core.startswith(code_stem(source_code))
                )
                for source_code in row.get("source_model_codes", "").split(" | ")
            )

        family_code_rows = [
            row for row in exact_rows + stem_rows + related_rows if has_related_family_code(row)
        ]
        name_only_rows = [row for row in related_rows if row not in family_code_rows]
        family_code_years = {
            int(row["year"]) for row in family_code_rows if row["year"].isdigit()
        }
        named_items = named_model_evidence.get(model.model_code.upper(), [])
        if exact_years:
            basis = "exact full model code"
        elif family_code_years:
            basis = "related family/name evidence only; no exact-code year evidence"
        elif exact_rows:
            basis = "exact identity only; no year evidence"
        elif stem_rows:
            basis = "matching core-code identity only; no year evidence"
        else:
            basis = "no code-level year evidence"
        confirmed = bool(years)
        accepted_rows = [row for row in exact_rows if row["year"].isdigit()]
        if accepted_rows:
            confidence_score = min(int(row["year_confidence_score"]) for row in accepted_rows)
        elif exact_rows:
            confidence_score = 35
        elif stem_rows:
            confidence_score = 25
        else:
            confidence_score = 5
        if confidence_score >= 90:
            confidence_label = "Very high"
        elif confidence_score >= 80:
            confidence_label = "High"
        elif confidence_score >= 70:
            confidence_label = "Accepted"
        elif confidence_score >= 50:
            confidence_label = "Moderate"
        else:
            confidence_label = "Unconfirmed"
        open_range = any(str(row.get("open_range_evidence", "")).casefold() == "true" for row in accepted_rows)
        displayed_ranges = f"{years[0]}+" if years and open_range else _year_ranges(years)
        year_shape = _year_evidence_shape(years, open_range=open_range)
        family_code_open = any(
            str(row.get("open_range_evidence", "")).casefold() == "true" for row in family_code_rows
        )
        family_code_years = sorted(family_code_years)
        # Family evidence is scattered point observations across sibling codes.
        # Collapsing it into "1999-2013" reads as a production run and invites
        # exactly the inference the evidence policy forbids, so list the years.
        displayed_family_code_years = (
            f"{family_code_years[0]}+ (open-ended source range)"
            if family_code_years and family_code_open
            else _year_list(family_code_years)
        )
        evidence_rows = exact_rows + stem_rows + related_rows
        source_variations = sorted(
            {
                code
                for row in evidence_rows
                for code in row.get("source_model_codes", "").split(" | ")
                if code and code != model.model_code.upper()
            }
        )
        variation_labels = []
        same_core_variations = sorted(code for code in source_variations if code_stem(code) == local_core)
        family_variations = sorted(set(source_variations) - set(same_core_variations))
        if same_core_variations:
            variation_labels.append("Same core: " + ", ".join(same_core_variations))
        if family_variations:
            variation_labels.append("Related family: " + ", ".join(family_variations))
        if named_items:
            variation_labels.append("Name/capacity source (no model code)")
        evidence_sections = []
        evidence_groups = 0
        for field, label in EVIDENCE_COLUMNS.items():
            values = sorted({row[field] for row in evidence_rows if row.get(field)})
            if values:
                evidence_groups += 1
                evidence_sections.append(f"{label}: {' | '.join(values)}")
        technical_items = technical_evidence.get(model.model_code.upper(), [])
        if technical_items:
            evidence_groups += 1
            evidence_sections.append("Technical parts comparison: " + " | ".join(technical_items))
        if named_items:
            evidence_groups += 1
            evidence_sections.append(
                "Named model/capacity evidence (non-confirming): "
                + " | ".join(sorted({item["summary"] for item in named_items}))
            )
        notes = []
        if family_code_years or name_only_rows or named_items:
            related_keys = sorted({row["evidence_key"] for row in name_only_rows})
            sources = []
            if related_keys:
                sources.append(", ".join(related_keys))
            if family_code_years:
                sources.append("related code-prefix listings")
            if named_items:
                sources.append("the 2017 Scooter Application List")
            notes.append("Family evidence comes from: " + "; ".join(sources) + ".")
        workbook = workbook_activity.get(model.model_code.upper())
        if workbook:
            evidence_groups += 1
            evidence_sections.append(
                f"Local workbook maintenance ({workbook['source_file']}): "
                f"{workbook['revision_count']} dated change-log entries "
                f"{workbook['first']} to {workbook['last']}; activity years "
                f"{workbook['years']}. Document maintenance, not a production range."
            )
        coverage.append(
            {
                "local_model_name": model.name,
                "local_model_code": model.model_code,
                "code_stem": code_stem(model.model_code),
                "coverage_status": "Confirmed" if confirmed else "Unconfirmed",
                "year_confidence_score": confidence_score,
                "year_confidence_band": confidence_label,
                "warning_required": "false" if confirmed else "true",
                **year_shape,
                "year_ranges": displayed_ranges,
                "known_family_code_years": displayed_family_code_years,
                "workbook_activity_years": workbook["years"] if workbook else "",
                "known_shared_family_code_variations": " | ".join(variation_labels),
                "open_range_evidence": "true" if open_range else "false",
                "evidence_basis": basis,
                "evidence_groups": evidence_groups,
                "aggregated_evidence": "\n".join(evidence_sections),
                "coverage_note": " ".join(notes),
            }
        )
    return coverage


def _render_coverage_html(rows, *, generated_at):
    display_fields = [
        "local_model_name",
        "local_model_code",
        "observed_years",
        "known_family_code_years",
        "workbook_activity_years",
        "known_shared_family_code_variations",
        "aggregated_evidence",
    ]
    headers = {
        "local_model_name": "Local model",
        "local_model_code": "Local parts-book code",
        "code_stem": "Core code",
        "coverage_status": "Coverage",
        "year_confidence_score": "Confidence / 100",
        "year_confidence_band": "Confidence band",
        "warning_required": "Warning required",
        "year_evidence_shape": "What the evidence is",
        "observed_years": "Observed years (direct evidence)",
        "earliest_confirmed_year": "Earliest confirmed",
        "latest_confirmed_year": "Latest confirmed",
        "unevidenced_years": "Years with no evidence",
        "inferred_year_range": "Inferred range (not proven)",
        "year_ranges": "Confirmed supported years",
        "known_family_code_years": "Known family-code years (not fitment)",
        "workbook_activity_years": "Local workbook activity (document dates)",
        "known_shared_family_code_variations": "Known shared family code variations",
        "open_range_evidence": "Open-ended evidence",
        "evidence_basis": "Evidence basis",
        "evidence_groups": "Evidence groups",
        "aggregated_evidence": "Aggregated evidence for this local code",
        "coverage_note": "Note",
    }
    header_html = "".join(f"<th>{headers[field]}</th>" for field in display_fields)

    def cell_html(field, row):
        value = row[field]
        if field == "aggregated_evidence":
            content = escape(str(value))
            content = re.sub(
                r"(https?://[^\s|<]+)",
                r'<a href="\1" target="_blank" rel="noopener noreferrer">source</a>',
                content,
            )
            content = content.replace("\n", "<br><br>")
            return (
                f'<td class="evidence"><details><summary>{row["evidence_groups"]} evidence '
                f'group(s)</summary>{content}</details></td>'
            )
        return f"<td>{escape(str(value))}</td>"

    body = []
    for row in rows:
        hue = round(int(row["year_confidence_score"]) * 1.2)
        cells = "".join(cell_html(field, row) for field in display_fields)
        body.append(
            f'<tr style="--confidence-hue:{hue}" data-status="{row["coverage_status"]}" '
            f'data-score="{row["year_confidence_score"]}">{cells}</tr>'
        )
    confirmed = sum(row["coverage_status"] == "Confirmed" for row in rows)
    return f"""<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>SYM local parts-book evidence</title>
<style>*{{box-sizing:border-box}}body{{margin:0;background:#f3f6f8;color:#17202a;font:14px/1.45 Arial,sans-serif}}
header{{padding:24px 28px;background:#132f43;color:#fff}}h1{{margin:0 0 5px}}header p{{margin:0;color:#dce8ef}}
.summary,.controls{{display:flex;gap:12px;flex-wrap:wrap;padding:14px 24px;background:#fff;border-bottom:1px solid #d9e0e6}}
.card{{padding:8px 14px;border:1px solid #d9e0e6;border-radius:6px}}.card b{{font-size:18px}}
input,select{{padding:9px 11px;min-width:220px;border:1px solid #aebbc5;border-radius:5px}}.wrap{{overflow:auto;height:calc(100vh - 220px)}}
table{{border-collapse:separate;border-spacing:0;width:100%;background:#fff}}th{{position:sticky;top:0;background:#e7eef3;text-align:left;padding:9px;border:1px solid #d9e0e6}}
td{{padding:8px;border-right:1px solid #d9e0e6;border-bottom:1px solid #d9e0e6;background:hsl(var(--confidence-hue) 58% 94%)}}
tr:nth-child(even) td{{background:hsl(var(--confidence-hue) 48% 91%)}}td:first-child{{border-left:6px solid hsl(var(--confidence-hue) 70% 40%)}}tr:hover td{{filter:brightness(.96)}}.hidden{{display:none}}
td.evidence{{min-width:360px;max-width:680px}}details summary{{cursor:pointer;font-weight:700;color:#1261a0}}details[open] summary{{margin-bottom:8px}}a{{color:#1261a0}}
</style></head><body><header><h1>SYM local parts-book evidence</h1><p>Generated {generated_at}. One row per local book. Confirmed and suspected years are deliberately kept separate.</p></header>
<section class="summary"><div class="card"><b>{len(rows)}</b><br>active local books</div><div class="card"><b>{confirmed}</b><br>confirmed under current policy</div><div class="card"><b>{len(rows)-confirmed}</b><br>require warning</div><div class="card"><b id="visible">{len(rows)}</b><br>visible</div></section>
<section class="controls"><input id="search" type="search" placeholder="Search model, code or year"><select id="status"><option value="all">All coverage</option><option>Confirmed</option><option>Unconfirmed</option></select></section>
<div class="wrap"><table><thead><tr>{header_html}</tr></thead><tbody>{''.join(body)}</tbody></table></div>
<script>const rs=[...document.querySelectorAll('tbody tr')],q=document.querySelector('#search'),s=document.querySelector('#status'),v=document.querySelector('#visible');function f(){{let n=0;for(const r of rs){{const show=(!q.value||r.textContent.toLowerCase().includes(q.value.toLowerCase()))&&(s.value==='all'||r.dataset.status===s.value);r.classList.toggle('hidden',!show);if(show)n++;}}v.textContent=n}}q.addEventListener('input',f);s.addEventListener('change',f);</script>
</body></html>"""


def _write_csv(path, fields, rows):
    with path.open("w", encoding="utf-8-sig", newline="") as output:
        writer = csv.DictWriter(output, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


class Command(BaseCommand):
    help = "Build searchable HTML and CSV evidence tables without discarding non-local models."

    def add_arguments(self, parser):
        default_dir = Path(settings.BASE_DIR) / "data_management" / "data" / "sym_model_years"
        parser.add_argument("--input-dir", type=Path, default=default_dir)
        parser.add_argument("--output-dir", type=Path, default=default_dir)

    def handle(self, *args, **options):
        output_dir = options["output_dir"]
        output_dir.mkdir(parents=True, exist_ok=True)
        claims = _claims(options["input_dir"])
        local_models = list(PartsModel.objects.filter(is_active=True).order_by("model_code"))
        rows = build_matrix(claims=claims, local_models=local_models)
        raw_rows = [
            {**claim, "code_stem": claim["model_code"].split("-", 1)[0].upper() if claim["model_code"] else ""}
            for claim in claims
        ]
        matrix_path = output_dir / "all_models_evidence_matrix.csv"
        raw_path = output_dir / "all_source_claims.csv"
        coverage_path = output_dir / "local_book_year_coverage.csv"
        coverage_html_path = output_dir / "local_book_year_coverage.html"
        html_path = output_dir / "all_models_evidence_table.html"
        audit_html_path = output_dir / "all_models_year_evidence_audit.html"
        coverage_rows = _coverage_rows(
            rows,
            local_models,
            technical_evidence=_technical_equivalence_evidence(options["input_dir"]),
            named_model_evidence=_named_model_evidence(options["input_dir"]),
            workbook_activity=_workbook_activity(options["input_dir"]),
        )
        _write_csv(matrix_path, MATRIX_FIELDS, rows)
        _write_csv(raw_path, RAW_FIELDS, raw_rows)
        _write_csv(coverage_path, COVERAGE_FIELDS, coverage_rows)
        generated_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
        coverage_html = _render_coverage_html(coverage_rows, generated_at=generated_at)
        html_path.write_text(coverage_html, encoding="utf-8")
        coverage_html_path.write_text(coverage_html, encoding="utf-8")
        audit_html_path.write_text(render_matrix_html(rows, generated_at=generated_at), encoding="utf-8")
        self.stdout.write(
            self.style.SUCCESS(
                f"Wrote {len(raw_rows)} source claims and {len(rows)} year-by-year evidence rows."
            )
        )
        self.stdout.write(str(html_path))
        self.stdout.write(str(matrix_path))
        self.stdout.write(str(raw_path))
        self.stdout.write(str(coverage_path))
        self.stdout.write(str(coverage_html_path))
        self.stdout.write(str(audit_html_path))
