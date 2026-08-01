"""Read Australian RVCS vehicle approvals and Road Vehicle Descriptors.

The legacy RVCS/RAWS lookup at ``mvsa.infrastructure.gov.au`` is an Angular
front end over a public, unauthenticated JSON API.  Approvals are enumerable,
so this module reads the whole SYM/Bolwell corpus instead of transcribing
selected records by hand.

Three endpoints matter:

``POST /api/v1/list/data/rvcs-schema``
    Approval search.  ``CertUnitId`` in a result *is* the approval number.
``GET /api/v1/forms/view/cert-unit/{approval}``
    Approval detail: certification model, approval status and its date, the
    dated approval PDFs, and every Road Vehicle Descriptor version.
``GET /api/v1/forms/view/rvd/{rvd}``
    One RVD version: issue date, marketing designation, variants, VIN
    patterns, engine data, compliance-plate images and free-text remarks.

Grid-shaped fields arrive as a JSON *string* holding ``{"Cols": [...]}`` rows,
so parsing is kept separate from fetching and is directly testable.
"""

from __future__ import annotations

import json
import re
import time
from dataclasses import asdict, dataclass, field

import requests


API_BASE = "https://mvsa-api.infrastructure.gov.au/api/v1"
PORTAL_BASE = "https://mvsa.infrastructure.gov.au"
DEFAULT_DELAY_SECONDS = 1.0
SEARCH_PAGE_SIZE = 200

REQUEST_HEADERS = {
    "User-Agent": "AllBikes model-year research (contact@allbikes.com.au)",
    "Accept": "application/json",
    "Content-Type": "application/json",
    # The API is CORS-open but the portal origin keeps the request honest about
    # which front end these calls belong to.
    "Origin": PORTAL_BASE,
}

# Makes worth enumerating.  The Australian importer traded under several names
# over the years and an approval keeps whichever make it was issued under, so a
# single-make search silently drops most of the corpus.
SYM_MAKES = ("SYM", "BOLWELL")

_MODEL_CODE_RE = re.compile(r"\b([A-Z]{2,3}\d{2}[A-Z0-9]{0,3}(?:-[A-Z0-9]{1,2})?)\b")
_DATE_RE = re.compile(r"(\d{2})/(\d{2})/((?:19|20)\d{2})")
_STATUS_DATE_RE = re.compile(r"(\d{2})/(\d{2})/((?:19|20)\d{2})")
_ISSUED_ON_RE = re.compile(r"Issued On\s+(\d{1,2})-([A-Za-z]+)-((?:19|20)\d{2})", re.I)
_RVD_LINK_RE = re.compile(r"/rvcs/rvd/(\d+)")

_MONTHS = {
    "january": 1, "february": 2, "march": 3, "april": 4, "may": 5, "june": 6,
    "july": 7, "august": 8, "september": 9, "october": 10, "november": 11, "december": 12,
}


class RvcsError(RuntimeError):
    """The RVCS API answered, but not with the shape this module relies on."""


def _grid(value):
    """Decode one embedded ``{"Cols": [...]}`` grid into header/value rows.

    Returns a list of rows, each a list of ``(header, value, link)`` triples.
    Headers repeat and are frequently blank, so callers get the raw triples
    rather than a dict that would silently drop columns.
    """
    if not value:
        return []
    if isinstance(value, str):
        try:
            value = json.loads(value)
        except json.JSONDecodeError as exc:
            raise RvcsError(f"Could not decode an RVCS grid field: {exc}") from exc
    rows = []
    for row in value or []:
        rows.append(
            [
                ((col.get("Header") or "").strip(), (col.get("Value") or "").strip(), col.get("Option"))
                for col in row.get("Cols", [])
            ]
        )
    return rows


def _iso_date(day, month, year):
    return f"{int(year):04d}-{int(month):02d}-{int(day):02d}"


def parse_portal_date(value):
    """Return ``YYYY-MM-DD`` for a ``DD/MM/YYYY`` portal date, else ``""``."""
    match = _DATE_RE.search(value or "")
    if match is None:
        return ""
    day, month, year = match.groups()
    return _iso_date(day, month, year)


def parse_approval_status(value):
    """Split ``"Approval Lapsed on 09/07/2023"`` into a state and a date.

    The date is *not* interpreted here.  Bulk lapses share one date across many
    unrelated approvals because the Motor Vehicle Standards Act 1989 approvals
    were retired together, so only the caller — which can see the whole corpus
    — can tell an administrative lapse from a model-specific one.
    """
    text = " ".join((value or "").split())
    date = parse_portal_date(text)
    state = _STATUS_DATE_RE.sub("", text).replace(" on ", " ").strip(" .")
    return {"approval_status": state, "approval_status_date": date}


def parse_approval_documents(value):
    """Return the dated approval PDFs attached to an approval."""
    documents = []
    for row in _grid(value):
        for _header, text, link in row:
            match = _ISSUED_ON_RE.search(text)
            if match is None or not link:
                continue
            day, month_name, year = match.groups()
            month = _MONTHS.get(month_name.casefold())
            if month is None:
                continue
            documents.append({"issued_on": _iso_date(day, month, year), "document_url": link})
    return sorted(documents, key=lambda item: item["issued_on"])


def _cell(row, header):
    for cell_header, value, _link in row:
        if cell_header == header:
            return value
    return ""


def _cell_link(row, header):
    for cell_header, _value, link in row:
        if cell_header == header:
            return link or ""
    return ""


def parse_rvd_documents(value):
    """Return every RVD version listed on an approval, with its supersession link.

    The supersession chain is the useful part: it orders revisions of the same
    approval and names which descriptor replaced which.
    """
    documents = []
    for row in _grid(value):
        reference = _cell(row, "Document Reference")
        if not reference:
            continue
        rvd_link = _cell_link(row, "Document Reference")
        replacement_link = _cell_link(row, "Replacement Document Reference")
        rvd_match = _RVD_LINK_RE.search(rvd_link or "")
        replacement_match = _RVD_LINK_RE.search(replacement_link or "")
        documents.append(
            {
                "reference": reference,
                "rvd_id": int(rvd_match.group(1)) if rvd_match else None,
                "body_type": _cell(row, "Body Type"),
                "marketing_designation": _cell(row, "Marketing Designation"),
                "replacement_type": _cell(row, "Replacement Type"),
                "replacement_reference": _cell(row, "Replacement Document Reference"),
                "replacement_rvd_id": int(replacement_match.group(1)) if replacement_match else None,
            }
        )
    return documents


def parse_variant_names(value):
    """Return the named variants an RVD covers, in variant order."""
    names = []
    for row in _grid(value):
        labels = [text for header, text, _link in row if header == ""]
        if not labels or labels[0].casefold() != "variant name":
            continue
        names = [text for header, text, _link in row if header != "" and text]
    return names


def parse_identification_numbers(value):
    """Return ``(variant, vin_pattern)`` pairs from the RVD's VIN table.

    The VIN pattern is the strongest identity evidence in the record: an
    Australian pattern such as ``RFGHU05W8#S123456`` carries the market/spec
    digit that the local parts-book suffix also uses.
    """
    numbers = []
    for row in _grid(value):
        vin = _cell(row, "Vehicle Identification Number")
        if not vin:
            continue
        numbers.append({"variant": _cell(row, "Variant"), "vin_pattern": vin})
    return numbers


def extract_model_codes(*values):
    """Return plausible SYM model codes printed anywhere in the given text.

    An RVD's ``VehicleModel`` is usually the bare certification stem, but
    remarks, variant names and marketing text occasionally print the full
    suffixed code — which is the only place a local ``-8`` book has ever been
    confirmed from an external source.
    """
    codes = set()
    for value in values:
        for candidate in _MODEL_CODE_RE.findall((value or "").upper()):
            # Reject bare years and VIN fragments that fit the code shape.
            if candidate.isdigit() or len(candidate) < 5:
                continue
            codes.add(candidate)
    return sorted(codes)


# A SYM technical code is a two-letter family, a capacity pair and a series
# letter — ``LM30W``, ``AE05W6``, ``MB10A7-8``.  The series letter is what
# separates a code from a marketing designation such as ``HD200``; the
# two-letter family is what separates it from a trim label such as ``MIO50D``.
# Three-letter families do exist (``XDZ50-QT``) but only ever appear suffixed.
_VARIANT_CODE_RES = (
    re.compile(r"^[A-Z]{2}\d{2}[A-Z]\d?(?:-[A-Z0-9]{1,2})?$"),
    re.compile(r"^[A-Z]{2,3}\d{2}[A-Z0-9]{0,4}-[A-Z0-9]{1,2}$"),
)


def variant_model_codes(*values):
    """Return the RVD variant labels that are technical codes, not trim names.

    RVD variant tables are the richest identity field in the record: an
    approval's certification model is usually a bare stem, but its variants
    frequently name the specific series — ``AX15W2``, ``LM30W``, ``FS05W1``.
    """
    codes = set()
    for value in values:
        for label in re.split(r"\s*\|\s*", (value or "").upper()):
            label = label.strip()
            if any(pattern.match(label) for pattern in _VARIANT_CODE_RES):
                codes.add(label)
    return sorted(codes)


def vin_family(vin_pattern):
    """Return the vehicle-descriptor section of an RVD VIN pattern.

    The first three characters are the world manufacturer identifier, so the
    remainder is the part that carries the model code and, for Australian
    deliveries, the market/spec digit that the local parts-book suffix uses.
    """
    cleaned = re.sub(r"[^A-Z0-9]", "", (vin_pattern or "").upper())
    return cleaned[3:9] if len(cleaned) >= 9 else ""


@dataclass(frozen=True)
class ApprovalRecord:
    approval_number: int
    make: str
    marketing_model: str
    certification_model: str
    licensee: str
    approval_status: str
    approval_status_date: str
    last_approval_date: str
    build_volume: str
    document_title: str
    approval_documents: tuple = field(default=())
    rvd_documents: tuple = field(default=())

    @property
    def source_url(self):
        return f"{PORTAL_BASE}/rvcs/cert-unit/{self.approval_number}"

    def as_row(self):
        row = asdict(self)
        row["approval_documents"] = " | ".join(
            f"{item['issued_on']} {item['document_url']}" for item in self.approval_documents
        )
        row["rvd_documents"] = " | ".join(
            f"{item['reference']}#{item['rvd_id']}" for item in self.rvd_documents
        )
        row["source_url"] = self.source_url
        return row


@dataclass(frozen=True)
class RvdRecord:
    approval_number: int
    rvd_id: int
    reference: str
    issue_date: str
    rvd_status: str
    vehicle_make: str
    vehicle_model: str
    marketing_designation: str
    body_type: str
    vehicle_category: str
    licensee: str
    variant_names: str
    vin_patterns: str
    printed_model_codes: str
    remarks: str
    image_urls: str

    @property
    def source_url(self):
        return f"{PORTAL_BASE}/rvcs/rvd/{self.rvd_id}"

    def as_row(self):
        return {**asdict(self), "source_url": self.source_url}


def build_session():
    session = requests.Session()
    session.headers.update(REQUEST_HEADERS)
    return session


def _result(response):
    response.raise_for_status()
    payload = response.json()
    result = payload.get("result")
    if result is None:
        raise RvcsError(f"RVCS API returned no result: {payload.get('message') or payload}")
    return result


def search_approvals(session, *, timeout=60, **filters):
    """Return approval search rows for the given RVCS filter fields.

    Supported filters mirror the public search form: ``Make``, ``ImporterName``,
    ``ApprovalNumber``, ``MarketingModel``, ``ManufactureYear``,
    ``CertificationModel``, ``IssueStartDate`` and ``IssueEndDate``.
    """
    payload = {"index": 0, "size": SEARCH_PAGE_SIZE, "filter": filters}
    result = _result(session.post(f"{API_BASE}/list/data/rvcs-schema", json=payload, timeout=timeout))
    items = result.get("items") or []
    if result.get("total", 0) > len(items):
        raise RvcsError(
            f"RVCS search for {filters} returned {result['total']} rows but only {len(items)} "
            "were paged in; raise SEARCH_PAGE_SIZE before trusting this result."
        )
    return items


def fetch_approval(session, approval_number, *, timeout=60):
    """Read one approval's detail record, including its RVD version list."""
    result = _result(
        session.get(f"{API_BASE}/forms/view/cert-unit/{approval_number}", timeout=timeout)
    )
    values = result.get("initialValues") or {}
    status = parse_approval_status(values.get("Status"))
    return ApprovalRecord(
        approval_number=int(approval_number),
        make=values.get("Make", ""),
        marketing_model="",
        certification_model=values.get("Model", ""),
        licensee="",
        approval_status=status["approval_status"],
        approval_status_date=status["approval_status_date"],
        last_approval_date="",
        build_volume=values.get("BuildVolume", ""),
        document_title=" ".join((values.get("DocumentTitle") or "").split()),
        approval_documents=tuple(parse_approval_documents(values.get("ApprovalDocuments"))),
        rvd_documents=tuple(parse_rvd_documents(values.get("RvdDocuments"))),
    )


def fetch_rvd(session, approval_number, rvd_id, *, timeout=60):
    """Read one Road Vehicle Descriptor version."""
    result = _result(session.get(f"{API_BASE}/forms/view/rvd/{rvd_id}", timeout=timeout))
    values = result.get("initialValues") or {}
    variants = parse_variant_names(values.get("VariantInformation"))
    vins = parse_identification_numbers(values.get("IdentificationNumbers"))
    remarks = " ".join((values.get("Remarks") or "").split())
    try:
        images = json.loads(values.get("RvdImages") or "[]")
    except json.JSONDecodeError:
        images = []
    return RvdRecord(
        approval_number=int(approval_number),
        rvd_id=int(rvd_id),
        reference=values.get("Reference", ""),
        issue_date=parse_portal_date(values.get("DateStr")),
        rvd_status=" ".join((values.get("RvdStatus") or "").split()),
        vehicle_make=values.get("VehicleMake", ""),
        vehicle_model=values.get("VehicleModel", ""),
        marketing_designation=values.get("MarketingDesignation", ""),
        body_type=values.get("BodyType", ""),
        vehicle_category=values.get("VehicleCategory", ""),
        licensee=values.get("LicenseesName", ""),
        variant_names=" | ".join(variants),
        vin_patterns=" | ".join(item["vin_pattern"] for item in vins),
        printed_model_codes=" | ".join(
            extract_model_codes(
                values.get("VehicleModel"), remarks, " ".join(variants),
                values.get("MarketingDesignation"),
            )
        ),
        remarks=remarks,
        image_urls=" | ".join(images),
    )


def collect_sym_records(
    session,
    *,
    makes=SYM_MAKES,
    delay_seconds=DEFAULT_DELAY_SECONDS,
    timeout=60,
    progress=None,
):
    """Enumerate every SYM/Bolwell approval and all of its RVD versions."""
    approvals_by_number = {}
    for make in makes:
        for item in search_approvals(session, Make=make, timeout=timeout):
            number = item.get("CertUnitId")
            if number is None:
                continue
            approvals_by_number[int(number)] = item
        if delay_seconds:
            time.sleep(delay_seconds)
    if not approvals_by_number:
        raise RvcsError(f"RVCS returned no approvals for makes {makes!r}.")

    approvals, rvds = [], []
    for index, (number, summary) in enumerate(sorted(approvals_by_number.items()), start=1):
        record = fetch_approval(session, number, timeout=timeout)
        # The search row carries context the detail form leaves blank.
        record = ApprovalRecord(
            **{
                **asdict(record),
                "marketing_model": " ".join(str(summary.get("MarketingModel") or "").split()),
                "licensee": summary.get("ImporterFullName", ""),
                "last_approval_date": str(summary.get("LastApprovalDate") or "")[:10],
                "approval_documents": record.approval_documents,
                "rvd_documents": record.rvd_documents,
            }
        )
        approvals.append(record)
        if delay_seconds:
            time.sleep(delay_seconds)
        for document in record.rvd_documents:
            if document["rvd_id"] is None:
                continue
            rvds.append(fetch_rvd(session, number, document["rvd_id"], timeout=timeout))
            if delay_seconds:
                time.sleep(delay_seconds)
        if progress:
            progress(index, len(approvals_by_number), record, len(rvds))
    return approvals, sorted(rvds, key=lambda item: (item.approval_number, item.issue_date, item.rvd_id))


def administrative_status_dates(approvals, *, minimum_shared=3):
    """Return status dates shared by enough approvals to be administrative.

    The Motor Vehicle Standards Act 1989 approvals lapsed in bulk, so a date
    repeated across many unrelated approvals says nothing about when a model
    stopped being supplied.  Only an unshared date — a voluntary surrender, for
    instance — is evidence about one vehicle.
    """
    counts = {}
    for approval in approvals:
        if approval.approval_status_date:
            counts[approval.approval_status_date] = counts.get(approval.approval_status_date, 0) + 1
    return {date for date, count in counts.items() if count >= minimum_shared}
