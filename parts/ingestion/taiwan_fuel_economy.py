"""Read SYM fuel-economy certificate issue dates from Taiwan's MOEA archive.

The Ministry of Economic Affairs publishes one open-data archive containing a
folder per month of vehicle fuel-economy certificate issuance, and each folder
carries separate domestic and imported motorcycle files.  A row names the
brand, the model — marketing name *and* the manufacturer's technical code
together, as in ``GTS 300i ABS LN30W5`` — and the date the certificate was
issued.

This is the source behind the project's earlier ``TB16W3`` finding, read
systematically instead of by hand.  A certificate date is a point-in-time
observation for a core code: it shows the model was being certified in Taiwan
on that date, not that a suffixed local parts book applies.

The archive begins in ROC year 106 (2017), so it cannot speak about the older
Australian books at all.
"""

from __future__ import annotations

import csv
import io
import re
import zipfile
from dataclasses import asdict, dataclass


ARCHIVE_URL = "https://www.moeaea.gov.tw/ECW/populace/opendata/wHandOpenData_File.ashx?set_id=7"
DATASET_PAGE = "https://data.gov.tw/dataset/6032"
SYM_BRAND = "三陽"

REQUEST_HEADERS = {
    "User-Agent": "AllBikes model-year research (contact@allbikes.com.au)",
    "Accept": "application/zip,*/*",
}

# Files are Big5 on older months and UTF-8 later; try the likely encodings.
_ENCODINGS = ("utf-8-sig", "utf-8", "big5", "cp950")

# Motorcycle certificate files, excluding the electric-vehicle labelling ones
# which describe a different scheme.
_MOTORCYCLE_FILE_RE = re.compile(r"機車")
_ELECTRIC_FILE_RE = re.compile(r"電動")

# A SYM technical code as printed beside the marketing name: two letters, a
# capacity pair, then one or two series letters and an optional digit —
# ``LN30W5``, ``HM12UU``, ``PD25AB``, ``TB16W3``.
_CODE_RE = re.compile(r"\b([A-Z]{2}\d{2}[A-Z]{1,2}\d?)\b")

_ROC_DATE_RE = re.compile(r"^\s*(\d{2,3})[/.\-](\d{1,2})[/.\-](\d{1,2})\s*$")
_BRAND_HEADER_RE = re.compile(r"廠\s*牌")
_ISSUE_DATE_HEADER = "耗能證明核發日期"
_HEADER_FIELDS = {
    "brand": "廠牌",
    "model": "車型",
    "displacement": "排氣量",
    "applicant": "申請單位",
    "issue_date": _ISSUE_DATE_HEADER,
}

ROC_EPOCH = 1911


class TaiwanFuelEconomyError(RuntimeError):
    """The MOEA archive did not have the structure this module relies on."""


def roc_date_to_iso(value):
    """Convert a Republic-of-China calendar date to ISO, e.g. ``106/10/03``.

    ROC year 1 is 1912, so the offset is a constant 1911.
    """
    match = _ROC_DATE_RE.match(str(value or ""))
    if match is None:
        return ""
    roc_year, month, day = (int(part) for part in match.groups())
    year = roc_year + ROC_EPOCH
    if not (2000 <= year <= 2100) or not (1 <= month <= 12) or not (1 <= day <= 31):
        return ""
    return f"{year:04d}-{month:02d}-{day:02d}"


def extract_model_codes(model_text):
    """Return the technical codes printed alongside a marketing model name."""
    return sorted({match for match in _CODE_RE.findall((model_text or "").upper())})


def decode_archive_text(raw):
    for encoding in _ENCODINGS:
        try:
            return raw.decode(encoding)
        except UnicodeDecodeError:
            continue
    return ""


def _normalise(cell):
    return re.sub(r"\s", "", str(cell or ""))


def _header_map(rows):
    """Locate the two-row split header and map our fields onto columns."""
    for index, row in enumerate(rows[:12]):
        if not any(_BRAND_HEADER_RE.search(str(cell)) for cell in row):
            continue
        below = rows[index + 1] if index + 1 < len(rows) else []
        width = max(len(row), len(below))
        combined = [
            _normalise(row[column] if column < len(row) else "")
            + _normalise(below[column] if column < len(below) else "")
            for column in range(width)
        ]
        positions = {}
        for field, label in _HEADER_FIELDS.items():
            for column, text in enumerate(combined):
                if text.startswith(label):
                    positions[field] = column
                    break
        if "issue_date" in positions and "model" in positions:
            return index + 2, positions
    return None, {}


@dataclass(frozen=True)
class FuelEconomyCertificate:
    brand: str
    model_text: str
    model_code: str
    issue_date: str
    displacement_cc: str
    applicant: str
    source_file: str

    @property
    def source_url(self):
        return DATASET_PAGE

    def as_row(self):
        return {**asdict(self), "source_url": self.source_url}


def parse_certificate_csv(text, *, source_file="", brand=SYM_BRAND):
    """Read one monthly certificate file, keeping only the given brand.

    One certificate can name several codes; each becomes its own record so a
    code-keyed lookup never has to split a free-text model field.
    """
    rows = list(csv.reader(io.StringIO(text or "")))
    start, positions = _header_map(rows)
    if start is None:
        return []
    certificates = []
    for row in rows[start:]:
        def value(field):
            column = positions.get(field)
            return str(row[column]).strip() if column is not None and column < len(row) else ""

        if brand and brand not in value("brand") and brand not in value("applicant"):
            continue
        issue_date = roc_date_to_iso(value("issue_date"))
        if not issue_date:
            continue
        model_text = " ".join(value("model").split())
        for code in extract_model_codes(model_text):
            certificates.append(
                FuelEconomyCertificate(
                    brand=value("brand"),
                    model_text=model_text,
                    model_code=code,
                    issue_date=issue_date,
                    displacement_cc=value("displacement"),
                    applicant=value("applicant"),
                    source_file=source_file,
                )
            )
    return certificates


def parse_archive(data, *, brand=SYM_BRAND, progress=None):
    """Read every monthly motorcycle file in the MOEA archive ZIP."""
    try:
        archive = zipfile.ZipFile(io.BytesIO(data))
    except zipfile.BadZipFile as exc:
        raise TaiwanFuelEconomyError(f"MOEA archive was not a ZIP: {exc}") from exc
    names = [
        name
        for name in archive.namelist()
        if _MOTORCYCLE_FILE_RE.search(name) and not _ELECTRIC_FILE_RE.search(name)
    ]
    if not names:
        raise TaiwanFuelEconomyError("MOEA archive contained no motorcycle certificate files.")
    certificates, unreadable = [], []
    for index, name in enumerate(sorted(names), start=1):
        text = decode_archive_text(archive.read(name))
        if not text:
            unreadable.append(name)
            continue
        certificates.extend(
            parse_certificate_csv(text, source_file=name.rsplit("/", 1)[-1], brand=brand)
        )
        if progress:
            progress(index, len(names), len(certificates))
    deduplicated = {
        (item.model_code, item.issue_date, item.model_text): item for item in certificates
    }
    return (
        sorted(deduplicated.values(), key=lambda item: (item.model_code, item.issue_date)),
        unreadable,
    )


def fetch_archive(session=None, *, timeout=300):
    import requests

    session = session or requests.Session()
    session.headers.update(REQUEST_HEADERS)
    response = session.get(ARCHIVE_URL, timeout=timeout)
    response.raise_for_status()
    return response.content
