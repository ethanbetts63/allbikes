"""Collect SYM model/year/code relationships from the public model selector.

The source site contains substantially more data than Allbikes needs.  This
module only parses vehicle identity metadata from the paginated model search:
name, capacity, year, technical model code, and catalogue URL.  It does not
visit or collect parts diagrams, part numbers, images, or prices.
"""

from __future__ import annotations

import re
import time
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote, urljoin, urlparse

import requests
from bs4 import BeautifulSoup


BASE_URL = "https://www.bike-parts-sym.nl"
SEARCH_URL = f"{BASE_URL}/sym-motorfietsen/zoek_voertuig/modellen"
CODE_SEARCH_URL = f"{SEARCH_URL}/{{model_code}}/europe"
SOURCE_MARKET = "NL"
DEFAULT_DELAY_SECONDS = 5.1
REQUEST_HEADERS = {
    "User-Agent": "AllbikesPartsResearch/1.0 (+https://www.allbikes.com.au)",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-AU,en;q=0.9,nl;q=0.5",
}

_MODEL_CODE_RE = re.compile(r"\(([A-Z]{1,5}\d{2}[A-Z0-9]*-[A-Z0-9]+)\)", re.I)
_CAPACITY_RE = re.compile(r"Cilinderinhoud:\s*(\d+)\s*cc", re.I)
_YEAR_RE = re.compile(r"Jaar:\s*(\d{4})", re.I)
_PAREN_RE = re.compile(r"\(([^()]*)\)")


@dataclass(frozen=True)
class ModelYearRelationship:
    customer_name: str
    variant: str
    source_title: str
    vehicle_type: str
    engine_cc: int
    year: int
    model_code: str
    code_qualifiers: str
    catalog_id: str
    source_url: str
    source_market: str = SOURCE_MARKET

    def as_row(self):
        return asdict(self)


def _clean_space(value):
    return " ".join((value or "").split())


def _title_parts(title, code_match):
    before_code = title[: code_match.start()].strip()
    customer_name = _PAREN_RE.sub("", before_code)
    customer_name = _clean_space(customer_name)
    variants = [_clean_space(value) for value in _PAREN_RE.findall(before_code)]
    after_code = title[code_match.end() :]
    qualifiers = [_clean_space(value) for value in _PAREN_RE.findall(after_code)]
    return customer_name, " | ".join(filter(None, variants)), " | ".join(filter(None, qualifiers))


def parse_search_page(html):
    """Parse the vehicle identity cards on one model-search result page."""
    soup = BeautifulSoup(html, "html.parser")
    relationships = []
    seen = set()

    for card in soup.select(".infos_vehicle"):
        link = card.select_one("a[href]")
        paragraphs = card.select("p")
        if link is None or not paragraphs:
            continue

        title = _clean_space(paragraphs[0].get_text(" ", strip=True))
        text = card.get_text(" ", strip=True)
        code_match = _MODEL_CODE_RE.search(title)
        capacity_match = _CAPACITY_RE.search(text)
        year_match = _YEAR_RE.search(text)
        if not (code_match and capacity_match and year_match):
            continue

        href = urljoin(BASE_URL, link["href"])
        path_parts = [part for part in urlparse(href).path.split("/") if part]
        catalog_id = path_parts[-1] if path_parts else ""
        key = (catalog_id, href)
        if key in seen:
            continue
        seen.add(key)

        customer_name, variant, qualifiers = _title_parts(title, code_match)
        vehicle_label = _clean_space(paragraphs[1].get_text(" ", strip=True)) if len(paragraphs) > 1 else ""
        vehicle_type = re.sub(r"^SYM\s+", "", vehicle_label, flags=re.I)
        relationships.append(
            ModelYearRelationship(
                customer_name=customer_name,
                variant=variant,
                source_title=title,
                vehicle_type=vehicle_type,
                engine_cc=int(capacity_match.group(1)),
                year=int(year_match.group(1)),
                model_code=code_match.group(1).upper(),
                code_qualifiers=qualifiers,
                catalog_id=catalog_id,
                source_url=href,
            )
        )

    return relationships


def _code_search_url(model_code):
    return CODE_SEARCH_URL.format(model_code=quote(model_code, safe="-"))


def scrape_model_codes(
    model_codes,
    *,
    cache_dir,
    refresh=False,
    delay_seconds=DEFAULT_DELAY_SECONDS,
    timeout=30,
):
    """Fetch selector results for local model codes, using an on-disk cache.

    Searching by the local technical codes is both narrower and more complete
    than the site's global index, which omits many historical vehicles.
    """
    cache_dir = Path(cache_dir)
    cache_dir.mkdir(parents=True, exist_ok=True)
    session = requests.Session()
    session.headers.update(REQUEST_HEADERS)
    relationships = {}
    last_request_at = None

    for model_code in sorted({code.upper() for code in model_codes}):
        url = _code_search_url(model_code)
        cache_path = cache_dir / f"code-{model_code}.html"

        if cache_path.exists() and not refresh:
            html = cache_path.read_text(encoding="utf-8")
        else:
            if last_request_at is not None:
                remaining = delay_seconds - (time.monotonic() - last_request_at)
                if remaining > 0:
                    time.sleep(remaining)
            response = session.get(url, timeout=timeout)
            last_request_at = time.monotonic()
            response.raise_for_status()
            html = response.text
            cache_path.write_text(html, encoding="utf-8")

        # The site's keyword search can be fuzzy. Persist exact code matches
        # only so a similarly named European variant cannot enter the result.
        for relationship in parse_search_page(html):
            if relationship.model_code == model_code:
                relationships[(relationship.catalog_id, relationship.source_url)] = relationship

    return sorted(
        relationships.values(),
        key=lambda item: (item.customer_name.casefold(), item.year, item.model_code, item.catalog_id),
    )


def parse_cached_relationships(cache_dir):
    """Return every unique relationship present in the cached selector pages."""
    relationships = {}
    for cache_path in Path(cache_dir).glob("*.html"):
        html = cache_path.read_text(encoding="utf-8")
        for relationship in parse_search_page(html):
            key = (
                relationship.model_code,
                relationship.year,
                relationship.customer_name,
                relationship.variant,
                relationship.code_qualifiers,
                relationship.catalog_id,
            )
            relationships[key] = relationship
    return sorted(
        relationships.values(),
        key=lambda item: (item.customer_name.casefold(), item.year, item.model_code, item.catalog_id),
    )


def retrieval_timestamp():
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()
