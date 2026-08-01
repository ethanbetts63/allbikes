"""Read the approval documents and plate images attached to Australian RVCS approvals.

The approval search summaries mask the model-year character of a typical VIN
with a placeholder (``RFGHU05W8#S123456``), but the approval PDF itself prints
it (``RFGHU05W85S123456``).  Position 10 of a VIN is the model year, and the
descriptors' own remarks state the convention outright — "10-th character in
VIN indicates year of manufacture. 5 is for 2005" — so each dated approval
document contributes a decodable model year for its certification model.

Schedule 2 of an approval also restates make, model, category and seating, and
Schedule 4 lists the ADR evidence items behind it.

Compliance-plate images are downloaded but not read: no OCR engine is
available in this environment, so they are catalogued for human review rather
than mined.
"""

from __future__ import annotations

import io
import re
from dataclasses import asdict, dataclass

from parts.vin import VIN_YEAR_PLACEHOLDERS, vin_model_year  # re-exported for callers


# The approval's own conditions name "Schedule 2" and "Schedule 3" in prose
# long before the schedules themselves appear, so the heading must be anchored
# to its own line and the right block picked by its contents.
_SCHEDULE2_RE = re.compile(
    r"^[ \t]*Schedule\s*2[ \t]*$(?P<body>.*?)(?=^[ \t]*Schedule\s*3[ \t]*$|\Z)",
    re.S | re.M | re.I,
)
_MAKE_LINE_RE = re.compile(r"^\s*Make\s*:", re.M | re.I)


def _schedule2_body(text):
    for match in _SCHEDULE2_RE.finditer(text or ""):
        body = match.group("body")
        if _MAKE_LINE_RE.search(body):
            return body
    return ""
_FIELD_RE = {
    "make": re.compile(r"^\s*Make\s*:\s*(.+?)\s*$", re.M | re.I),
    "model": re.compile(r"^\s*Model\s*:\s*(.+?)\s*$", re.M | re.I),
    "category": re.compile(r"^\s*Category\s*:\s*(.+?)\s*$", re.M | re.I),
    "typical_vin": re.compile(r"^\s*Typical\s+VIN\s*:\s*(.+?)\s*$", re.M | re.I),
    "manufactured_by": re.compile(r"^\s*Manufactured\s+by\s*:\s*(.+?)\s*$", re.M | re.I),
}
_ISSUE_DATE_RE = re.compile(
    r"Issue\s*[Dd]ate\s*:\s*(\d{1,2})\s+([A-Za-z]+)\s+((?:19|20)\d{2})"
)
_APPROVAL_NO_RE = re.compile(r"Approval\s*No\.?\s*:\s*(\d+)", re.I)
_EXPIRY_RE = re.compile(r"^\s*Expiry\s+date\s*:\s*(.+?)\s*$", re.M | re.I)
_PLATE_LOCATION_RE = re.compile(r"^\s*Plate\s+location\s*:\s*(.+?)\s*$", re.M | re.I)
_ADR_RE = re.compile(r"^\s*(\d{1,3}/\d{2})\s+(\S+)\s*$", re.M)
_CODE_RE = re.compile(r"\b([A-Z]{2,4}\d{2}[A-Z][A-Z0-9]{0,3}(?:-[A-Z0-9]{1,2})?)\b")

_MONTHS = {
    "january": 1, "february": 2, "march": 3, "april": 4, "may": 5, "june": 6,
    "july": 7, "august": 8, "september": 9, "october": 10, "november": 11, "december": 12,
}


def extract_pdf_text(data):
    """Return the embedded text of a PDF, or ``""`` when it has no text layer.

    A scanned approval yields nothing here.  That is reported rather than
    worked around, because guessing at an unreadable document is worse than
    recording that it needs OCR.
    """
    import pypdf

    try:
        reader = pypdf.PdfReader(io.BytesIO(data))
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
    except Exception:
        return ""
    return text.replace("\xa0", " ")


def parse_issue_date(text):
    """Return the approval's issue date as ``YYYY-MM-DD``, or ``""``."""
    match = _ISSUE_DATE_RE.search(text or "")
    if match is None:
        return ""
    day, month_name, year = match.groups()
    month = _MONTHS.get(month_name.casefold())
    if month is None:
        return ""
    return f"{int(year):04d}-{month:02d}-{int(day):02d}"


# SYM's Australian vehicles use these world manufacturer identifiers, and it is
# only for these that a descriptor states the position-10 year convention.
# Bolwell also imported PGO, whose RFV VINs put something else in that slot and
# decode to nonsense, so the rule is applied by WMI rather than to every VIN.
SYM_WMI = ("RFG", "LXM")


def accepted_vin_model_year(typical_vin, document_years):
    """Decode a typical VIN's model year, or explain why it cannot be trusted.

    A typical VIN is a template stored once against an approval, not reissued
    per document, so it yields one observation for the approval — the model
    year it was written around — and the approval's own document dates are what
    bound its plausibility.

    Returns ``(year, rejection_reason)``; exactly one of the two is set.
    """
    vin = re.sub(r"[^A-Z0-9#$%*?_]", "", (typical_vin or "").upper())
    if not vin:
        return None, "no typical VIN"
    if not vin.startswith(SYM_WMI):
        return None, f"non-SYM manufacturer identifier {vin[:3]}"
    years = sorted(year for year in document_years if year)
    if not years:
        return None, "no dated approval document"
    decoded = vin_model_year(vin, issue_year=years[-1])
    if decoded is None:
        return None, "position 10 is a placeholder or not a year code"
    if not (years[0] - 2 <= decoded <= years[-1] + 1):
        return None, (
            f"decoded {decoded} is outside the approval's document window "
            f"{years[0]}-{years[-1]}, so position 10 is not acting as a year here"
        )
    return decoded, ""


@dataclass(frozen=True)
class ApprovalDocument:
    approval_number: str
    document_date: str
    issue_date: str
    make: str
    model: str
    category: str
    manufactured_by: str
    typical_vin: str
    vin_model_year: object
    expiry: str
    plate_location: str
    printed_model_codes: str
    adr_items: str
    document_url: str
    has_text_layer: bool

    def as_row(self):
        row = asdict(self)
        row["has_text_layer"] = str(self.has_text_layer).lower()
        row["vin_model_year"] = self.vin_model_year or ""
        return row


def parse_approval_document(text, *, approval_number, document_date, document_url):
    """Read Schedule 2/3/4 out of one approval PDF's extracted text."""
    text = text or ""
    body = _schedule2_body(text)
    fields = {name: (pattern.search(body).group(1) if pattern.search(body) else "")
              for name, pattern in _FIELD_RE.items()}
    issue_date = parse_issue_date(text)
    issue_year = int(issue_date[:4]) if issue_date else None
    approval_match = _APPROVAL_NO_RE.search(text)
    expiry = _EXPIRY_RE.search(text)
    plate_location = _PLATE_LOCATION_RE.search(text)
    codes = sorted(
        {
            code
            for source in (fields["model"], fields["typical_vin"], body)
            for code in _CODE_RE.findall((source or "").upper())
        }
    )
    return ApprovalDocument(
        approval_number=str(approval_number or (approval_match.group(1) if approval_match else "")),
        document_date=document_date or "",
        issue_date=issue_date,
        make=fields["make"],
        model=fields["model"],
        category=fields["category"],
        manufactured_by=fields["manufactured_by"],
        typical_vin=fields["typical_vin"],
        vin_model_year=vin_model_year(fields["typical_vin"], issue_year=issue_year),
        expiry=expiry.group(1) if expiry else "",
        plate_location=plate_location.group(1) if plate_location else "",
        printed_model_codes=" | ".join(codes),
        adr_items=" | ".join(f"{rule}:{ref}" for rule, ref in _ADR_RE.findall(text)),
        document_url=document_url or "",
        has_text_layer=bool(text.strip()),
    )
