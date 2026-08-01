"""Compare SYM parts books using their diagram and OEM-part fingerprints.

This deliberately measures technical similarity only.  A high score can bridge a
dated external catalogue to a local book, but it never creates a year claim by
itself.  The caller must retain the dated source separately.
"""

from __future__ import annotations

import math
import re
import time
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup


REQUEST_HEADERS = {
    "User-Agent": "AllbikesPartsResearch/1.0 (+https://www.allbikes.com.au)",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-AU,en;q=0.9,nl;q=0.5",
}
DEFAULT_DELAY_SECONDS = 5.1
MAX_REQUEST_ATTEMPTS = 3
_PART_KEY_RE = re.compile(r"^(?=.*\d)[A-Z0-9]{7,}$")
_CATALOGUE_SECTION_RE = re.compile(r"/(\d+)/(\d+)/0/(\d+)/?$")
_COLOUR_WORDS = {
    "BLACK", "WHITE", "BLUE", "RED", "GREY", "GRAY", "GREEN", "BROWN",
    "SILVER", "YELLOW", "ORANGE", "BEIGE", "PURPLE", "PINK",
}
_PAINT_CODE_RE = re.compile(r"\b[A-Z]{1,3}-?\d{2,}[A-Z0-9]*\b")


def compact_part_number(value):
    """Return a punctuation-neutral OEM part identifier, or an empty string.

    The local XLS books use hyphenated numbers while Bike-Parts-SYM exposes the
    same numbers without hyphens.  This normalisation makes the comparison
    robust without guessing at part-number structure.
    """
    compact = re.sub(r"[^A-Z0-9]", "", str(value or "").upper())
    return compact if _PART_KEY_RE.match(compact) else ""


def normalise_name(value):
    return re.sub(r"[^a-z0-9]+", "", str(value or "").casefold())


@dataclass(frozen=True)
class BookFingerprint:
    code: str
    label: str
    part_numbers: frozenset[str]
    section_names: frozenset[str]
    source_url: str = ""
    year_from: int | None = None
    year_to: int | None = None
    sampled_sections: int = 0
    total_sections: int = 0


@dataclass(frozen=True)
class EquivalenceScore:
    shared_part_count: int
    left_part_count: int
    right_part_count: int
    left_overlap_percent: float
    right_overlap_percent: float
    weighted_jaccard_percent: float


def score_fingerprints(left, right, *, document_frequency, book_count):
    """Score equality of distinctive part sets using inverse book frequency."""
    shared = left.part_numbers & right.part_numbers
    union = left.part_numbers | right.part_numbers

    def weight(part_number):
        # Common fasteners contribute little; model-specific body/electrical
        # components contribute materially more.  Unknown external numbers are
        # conservatively treated as uncommon rather than ignored.
        frequency = document_frequency.get(part_number, 0)
        return math.log((book_count + 1) / (frequency + 1)) + 1

    weighted_union = sum(weight(part_number) for part_number in union)
    weighted_shared = sum(weight(part_number) for part_number in shared)
    return EquivalenceScore(
        shared_part_count=len(shared),
        left_part_count=len(left.part_numbers),
        right_part_count=len(right.part_numbers),
        left_overlap_percent=round(100 * len(shared) / len(left.part_numbers), 1)
        if left.part_numbers else 0.0,
        right_overlap_percent=round(100 * len(shared) / len(right.part_numbers), 1)
        if right.part_numbers else 0.0,
        weighted_jaccard_percent=round(100 * weighted_shared / weighted_union, 1)
        if weighted_union else 0.0,
    )


def local_document_frequency(fingerprints):
    return Counter(
        part_number
        for fingerprint in fingerprints
        for part_number in fingerprint.part_numbers
    )


def parse_catalogue_sections(html, source_url):
    """Return unique non-colour exploded-diagram URLs from a catalogue page."""
    soup = BeautifulSoup(html, "html.parser")
    sections = []
    seen = set()
    for link in soup.select("a[href]"):
        href = urljoin(source_url, link["href"])
        match = _CATALOGUE_SECTION_RE.search(urlparse(href).path)
        if match is None or href in seen:
            continue
        title = " ".join(link.stripped_strings)
        colour_label = title.split("voor", 1)[0].split("for", 1)[0].upper()
        title_words = set(re.findall(r"[A-Z]+", colour_label))
        # The top of a catalogue is commonly a set of paint variants.  Exclude
        # only links whose title is plainly a colour; do not assume a fixed
        # numeric section offset because older books differ.
        if (
            _PAINT_CODE_RE.search(colour_label)
            and not colour_label.startswith("SERVICE KIT")
        ) or (title_words and title_words <= _COLOUR_WORDS | {"AND", "GRIJS", "ZWART", "WIT"}):
            continue
        seen.add(href)
        sections.append((int(match.group(2)), title, href))
    return sorted(sections)


def parse_catalogue_part_numbers(html):
    """Extract OEM part references from a Bike-Parts-SYM diagram page."""
    soup = BeautifulSoup(html, "html.parser")
    return frozenset(
        part_number
        for link in soup.select("a.parts_ref")
        if (part_number := compact_part_number(link.get_text(" ", strip=True)))
    )


def representative_sections(sections, maximum):
    """Choose evenly spaced diagrams so a partial crawl covers the whole book."""
    if maximum <= 0 or len(sections) <= maximum:
        return sections
    indexes = {
        round(index * (len(sections) - 1) / (maximum - 1))
        for index in range(maximum)
    }
    return [section for index, section in enumerate(sections) if index in indexes]


def scrape_bike_parts_catalogue(
    source_url,
    *,
    cache_dir,
    maximum_sections=8,
    delay_seconds=DEFAULT_DELAY_SECONDS,
    timeout=30,
):
    """Fetch a sampled external catalogue, respecting the site's crawl delay."""
    cache_dir = Path(cache_dir)
    cache_dir.mkdir(parents=True, exist_ok=True)
    session = requests.Session()
    session.headers.update(REQUEST_HEADERS)
    last_request_at = None

    def get_cached(url, filename):
        nonlocal last_request_at
        path = cache_dir / filename
        if path.exists():
            return path.read_text(encoding="utf-8")
        if last_request_at is not None:
            remaining = delay_seconds - (time.monotonic() - last_request_at)
            if remaining > 0:
                time.sleep(remaining)
        for attempt in range(1, MAX_REQUEST_ATTEMPTS + 1):
            try:
                response = session.get(url, timeout=timeout)
                last_request_at = time.monotonic()
                response.raise_for_status()
                break
            except requests.RequestException:
                last_request_at = time.monotonic()
                if attempt == MAX_REQUEST_ATTEMPTS:
                    raise
                # Preserve the source's crawl delay even when it closes an
                # idle connection, then retry the single missing page.
                time.sleep(delay_seconds * attempt)
        path.write_text(response.text, encoding="utf-8")
        return response.text

    catalogue_key = re.sub(r"[^A-Za-z0-9]+", "-", urlparse(source_url).path).strip("-")[-100:]
    index_html = get_cached(source_url, f"{catalogue_key}-index.html")
    sections = parse_catalogue_sections(index_html, source_url)
    selected = representative_sections(sections, maximum_sections)
    part_numbers = set()
    names = set()
    for section_number, section_name, section_url in selected:
        html = get_cached(section_url, f"{catalogue_key}-section-{section_number}.html")
        part_numbers.update(parse_catalogue_part_numbers(html))
        if section_name:
            names.add(section_name)
    return BookFingerprint(
        code="",
        label="",
        part_numbers=frozenset(part_numbers),
        section_names=frozenset(names),
        source_url=source_url,
        sampled_sections=len(selected),
        total_sections=len(sections),
    )
