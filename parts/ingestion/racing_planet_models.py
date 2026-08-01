"""Collect the model identity options from Racing Planet's SYM selector."""

from __future__ import annotations

import re
from dataclasses import asdict, dataclass

import requests
from bs4 import BeautifulSoup


SOURCE_URL = (
    "https://www.racing-planet.com/scooter-moped-parts-sh-1.html"
    "?level2=16&level1=45360&level0=1164&olevel2=0&olevel1=34004&olevel0=1164"
)
REQUEST_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/125.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-AU,en;q=0.9",
}

_CODE_RE = re.compile(r"\[([^\]]+)\]\s*$")
_FOUR_YEAR_RANGE_RE = re.compile(r"(?<!\d)((?:19|20)\d{2})-((?:19|20)\d{2})(?!\d)")
_TWO_YEAR_RANGE_RE = re.compile(r"(?<!\d)(\d{2})-(\d{2})(?!\d)")
_OPEN_FROM_RE = re.compile(r"(?<!\d)(\d{2})-(?!\d)")
_OPEN_TO_RE = re.compile(r"(?<!\d)-(\d{2})(?!\d)")


@dataclass(frozen=True)
class RacingPlanetRelationship:
    selector_id: str
    source_title: str
    model_code: str
    year_from: int | None
    year_to: int | None
    range_is_open: bool
    source_url: str = SOURCE_URL
    source_market: str = "EU"

    def as_row(self):
        return asdict(self)


def _full_year(value):
    value = int(value)
    return 2000 + value if value <= 40 else 1900 + value


def _years(title):
    without_code = _CODE_RE.sub("", title)
    match = _FOUR_YEAR_RANGE_RE.search(without_code)
    if match:
        return int(match.group(1)), int(match.group(2)), False
    match = _TWO_YEAR_RANGE_RE.search(without_code)
    if match:
        return _full_year(match.group(1)), _full_year(match.group(2)), False
    match = _OPEN_FROM_RE.search(without_code)
    if match:
        return _full_year(match.group(1)), None, True
    match = _OPEN_TO_RE.search(without_code)
    if match:
        return None, _full_year(match.group(1)), True
    return None, None, False


def parse_selector(html):
    soup = BeautifulSoup(html, "html.parser")
    relationships = []
    for option in soup.select("select#level1 option[value]"):
        selector_id = option.get("value", "").strip()
        title = " ".join(option.get_text(" ", strip=True).split())
        if not selector_id or not title:
            continue
        code_match = _CODE_RE.search(title)
        year_from, year_to, range_is_open = _years(title)
        relationships.append(
            RacingPlanetRelationship(
                selector_id=selector_id,
                source_title=title,
                model_code=code_match.group(1).upper() if code_match else "",
                year_from=year_from,
                year_to=year_to,
                range_is_open=range_is_open,
            )
        )
    return relationships


def fetch_selector(*, timeout=30):
    response = requests.get(SOURCE_URL, headers=REQUEST_HEADERS, timeout=timeout)
    response.raise_for_status()
    return response.text
