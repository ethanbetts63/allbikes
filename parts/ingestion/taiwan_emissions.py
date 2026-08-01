"""Read SYM model years from Taiwan's new-motorcycle emissions certification register.

Taiwan is SYM's home market and its Ministry of Environment publishes the
new-vehicle type-approval register (dataset ``MPI_P_04``) as open data.  Each
record names the manufacturer's own technical code alongside a model year
stated by the regulator, which makes it the only structured source in this
project that is neither a retailer nor a re-seller.

Two limits are load-bearing and must not be papered over downstream:

* The register only covers the emissions standard in force from 2021-01-01, so
  it says nothing about earlier models.  It is a current-fleet snapshot, not a
  historical archive.
* Taiwan-domestic codes are frequently not the export codes.  A match is
  therefore *core-code* evidence about the family, never confirmation of a
  local suffixed parts book.

The site's own front-stage endpoint is used because the documented ``api/v2``
route requires a registered key while this one does not.
"""

from __future__ import annotations

import re
from dataclasses import asdict, dataclass

import requests


API_URL = "https://data.moenv.gov.tw/api/frontstage/datastore.search"
DATASET_PAGE = "https://data.moenv.gov.tw/dataset/detail/mpi_p_04"
# Resource behind dataset MPI_P_04 (機車新車審驗資料 — new motorcycle type approvals).
RESOURCE_ID = "02afa363-2f27-4abb-be3e-05a179212fdf"
SYM_MANUFACTURER = "三陽"
PAGE_SIZE = 1000
DEFAULT_DELAY_SECONDS = 1.0

REQUEST_HEADERS = {
    "User-Agent": "AllBikes model-year research (contact@allbikes.com.au)",
    "Accept": "application/json",
    "Content-Type": "application/json",
    "Origin": "https://data.moenv.gov.tw",
    "Referer": DATASET_PAGE,
}

# A SYM technical code is two to four letters, a capacity pair, then a series
# letter — ``LW30W2``, ``FKB16T4``, ``FAE12D2``.  Requiring the series letter
# keeps capacities ("158c.c.") and marketing tokens ("CVT", "HEV") out.
_CODE_RE = re.compile(r"\b([A-Z]{2,4}\d{2}[A-Z][A-Z0-9]{0,3})\b")


class TaiwanEmissionsError(RuntimeError):
    """The register answered, but not with the shape this module relies on."""


@dataclass(frozen=True)
class TaiwanCertification:
    manufacturer: str
    brand: str
    model_code: str
    model_year: int
    model_name: str
    certificate_number: str
    engine_family: str
    displacement_cc: str
    standard_date: str
    application_type: str

    @property
    def source_url(self):
        return DATASET_PAGE

    def as_row(self):
        return {**asdict(self), "source_url": self.source_url}


def extract_model_codes(model_name):
    """Return the technical codes printed in a register model name."""
    return sorted({match for match in _CODE_RE.findall((model_name or "").upper())})


def _model_year(value):
    value = (value or "").strip()
    return int(value) if re.fullmatch(r"(?:19|20)\d{2}", value) else None


def certifications_from_records(raw_records):
    """Turn raw register rows into one certification per code/year pair.

    Rows without a stated model year are dropped: an undated certificate cannot
    contribute a year, and this project does not infer one from a certificate
    number or an emissions-standard date.
    """
    certifications = {}
    for record in raw_records:
        year = _model_year(record.get("caryear"))
        if year is None:
            continue
        name = " ".join((record.get("carmodelname") or "").split())
        for code in extract_model_codes(name):
            certification = TaiwanCertification(
                manufacturer=" ".join((record.get("custname") or "").split()),
                brand=" ".join((record.get("brand") or "").split()),
                model_code=code,
                model_year=year,
                model_name=name,
                certificate_number=(record.get("certificateno") or "").strip(),
                engine_family=(record.get("enginegroup") or "").strip(),
                displacement_cc=(record.get("exhaust_value") or "").strip(),
                standard_date=(record.get("date") or "").strip(),
                application_type=(record.get("applytype") or "").strip(),
            )
            certifications[(code, year, certification.certificate_number)] = certification
    return sorted(
        certifications.values(),
        key=lambda item: (item.model_code, item.model_year, item.certificate_number),
    )


def build_session():
    session = requests.Session()
    session.headers.update(REQUEST_HEADERS)
    return session


def fetch_raw_records(session, *, manufacturer=SYM_MANUFACTURER, timeout=90, progress=None):
    """Page through every register row for one manufacturer."""
    records, offset, total = [], 0, None
    while total is None or offset < total:
        payload = {
            "resource_id": RESOURCE_ID,
            "limit": PAGE_SIZE,
            "offset": offset,
            "filter": [{"column": "custname", "operator": "contain", "value": manufacturer}],
        }
        response = session.post(API_URL, json=payload, timeout=timeout)
        response.raise_for_status()
        body = response.json()
        if not body.get("success"):
            raise TaiwanEmissionsError(f"Taiwan register rejected the query: {body.get('s_message')}")
        page = body.get("payload") or {}
        total = page.get("total", 0)
        page_records = page.get("records") or []
        if not page_records:
            break
        records.extend(page_records)
        offset += PAGE_SIZE
        if progress:
            progress(len(records), total)
    if not records:
        raise TaiwanEmissionsError(f"Taiwan register returned no rows for {manufacturer!r}.")
    return records


def scrape_sym_certifications(session=None, *, manufacturer=SYM_MANUFACTURER, timeout=90, progress=None):
    session = session or build_session()
    return certifications_from_records(
        fetch_raw_records(session, manufacturer=manufacturer, timeout=timeout, progress=progress)
    )
