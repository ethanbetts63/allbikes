"""Read explicit model-code/year listings from OEM Motorparts' public SYM index."""

from __future__ import annotations

import re
import time
from dataclasses import asdict, dataclass

import requests
from bs4 import BeautifulSoup


BASE_URL = "https://www.oemmotorparts.com/en/genuine-oem/sym?page={}"
PAGE_COUNT = 10
DEFAULT_DELAY_SECONDS = 1.0
REQUEST_HEADERS = {
    "User-Agent": "AllBikes model-year research (contact@allbikes.com.au)",
    "Accept": "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-AU,en;q=0.9",
}

# The index puts an explicit SYM code in parentheses, for example
# ``(XL20W1-IT)``.  Generation/emissions qualifiers such as ``(M1)`` are
# intentionally excluded because they are not standalone parts-book codes.
_MODEL_CODE_RE = re.compile(
    r"\((?![JKLMN]\d(?:-[JKLMN]\d)?\))([A-Z]{1,6}\d[A-Z0-9]*(?:-[A-Z0-9]+)+)\)",
    re.I,
)
_YEAR_RANGE_RE = re.compile(r"Produced from ((?:19|20)\d{2}) to ((?:19|20)\d{2})", re.I)
_GENERATION_RE = re.compile(r"\b[JKLMN]\d(?:-[JKLMN]\d)?\b", re.I)


@dataclass(frozen=True)
class OemMotorPartsRelationship:
    source_title: str
    model_code: str
    year_from: int
    year_to: int
    generation: str
    source_page: int
    source_url: str

    def as_row(self):
        return asdict(self)


def _clean_space(value):
    return " ".join((value or "").split())


def parse_sym_index_page(html, *, source_page):
    """Extract deduplicated code/year relationships from one index page."""
    soup = BeautifulSoup(html, "html.parser")
    relationships = {}
    for link in soup.select('table.modeltable a[href*="/en/model/sym/"]'):
        title = _clean_space(link.get_text(" ", strip=True))
        year_match = _YEAR_RANGE_RE.search(title)
        if year_match is None:
            continue
        year_from, year_to = (int(value) for value in year_match.groups())
        generation = " | ".join(sorted(set(_GENERATION_RE.findall(title.upper()))))
        for code in _MODEL_CODE_RE.findall(title):
            relationship = OemMotorPartsRelationship(
                source_title=title,
                model_code=code.upper(),
                year_from=year_from,
                year_to=year_to,
                generation=generation,
                source_page=source_page,
                source_url=link["href"],
            )
            relationships[(relationship.model_code, relationship.source_url)] = relationship
    return sorted(
        relationships.values(),
        key=lambda item: (item.model_code, item.year_from, item.source_url),
    )


def scrape_sym_index(*, delay_seconds=DEFAULT_DELAY_SECONDS, timeout=30, progress=None):
    """Read the site's bounded ten-page SYM index, respecting a request delay."""
    session = requests.Session()
    session.headers.update(REQUEST_HEADERS)
    relationships = {}
    for page in range(PAGE_COUNT):
        response = session.get(BASE_URL.format(page), timeout=timeout)
        response.raise_for_status()
        page_rows = parse_sym_index_page(response.text, source_page=page)
        if not page_rows:
            raise RuntimeError(f"OEM Motorparts SYM index page {page} had no model-code listings.")
        for row in page_rows:
            relationships[(row.model_code, row.source_url)] = row
        if progress:
            progress(page + 1, len(page_rows), len(relationships))
        if page < PAGE_COUNT - 1 and delay_seconds:
            time.sleep(delay_seconds)
    return sorted(
        relationships.values(),
        key=lambda item: (item.model_code, item.year_from, item.source_url),
    )
