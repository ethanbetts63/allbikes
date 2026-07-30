"""Scrape the Select Portal SYM parts-books index page.

One page is the source of truth for both the per-model book (.xls) links and the
current Price & Availability CSV link. Fetch is split from parse so the parser can
be tested against saved HTML without network access.
"""
import logging
import re
from datetime import datetime

import requests
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

SOURCE_URL = "https://www.selectportal.com.au/sym-spare-parts-books/"

# Select Portal returns 406 to the default requests User-Agent, so present a
# browser-like set of headers for the page fetch and file downloads.
REQUEST_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-AU,en;q=0.9",
}

# Heading text on the page -> our cc_class code.
_CC_CLASS_HEADINGS = [
    (re.compile(r"200.*400", re.I), "200_400"),
    (re.compile(r"100.*165", re.I), "100_165"),
    (re.compile(r"\bATV", re.I), "atv"),
    (re.compile(r"\b50cc\b", re.I), "50"),
]

_PA_LINK_RE = re.compile(r"price\s*&?\s*availability", re.I)
_PA_DATE_RE = re.compile(r"PA-(\d{1,2}-[A-Za-z]{3}-\d{2})")
_SUPPLEMENTARY_XLS_RE = re.compile(r"models?\s+(?:which|that)\s+use\s+the\s+same\s+parts", re.I)


def fetch_page(url=SOURCE_URL, timeout=30):
    resp = requests.get(url, headers=REQUEST_HEADERS, timeout=timeout)
    resp.raise_for_status()
    return resp.text


def download_bytes(url, *, timeout):
    response = requests.get(url, headers=REQUEST_HEADERS, timeout=timeout)
    response.raise_for_status()
    return response.content


def _cc_class_for(text):
    for pattern, code in _CC_CLASS_HEADINGS:
        if pattern.search(text or ""):
            return code
    return None


def parse_pa_link(html):
    """Return ``(pa_url, pa_date)`` for the Price & Availability CSV, or (None, None)."""
    soup = BeautifulSoup(html, "html.parser")
    for a in soup.find_all("a", href=True):
        label = a.get_text(strip=True)
        href = a["href"]
        if _PA_LINK_RE.search(label) or (href.lower().endswith(".csv") and "pa-" in href.lower()):
            return href, _parse_pa_date(href)
    return None, None


def _parse_pa_date(href):
    m = _PA_DATE_RE.search(href)
    if not m:
        return None
    try:
        return datetime.strptime(m.group(1), "%d-%b-%y").date()
    except ValueError:
        return None


def parse_books(html):
    """Return a list of ``{name, cc_class, url}`` for each model book (.xls) link.

    cc_class is inferred from the most recent section heading above the link in
    document order.
    """
    soup = BeautifulSoup(html, "html.parser")
    main = soup.find("main") or soup
    current_cc = None
    books = []
    for el in main.find_all(["h1", "h2", "h3", "h4", "h5", "p", "a"]):
        if el.name != "a":
            cc = _cc_class_for(el.get_text(" ", strip=True))
            if cc:
                current_cc = cc
            continue
        href = el.get("href", "")
        if not href.lower().endswith(".xls"):
            continue
        name = el.get_text(" ", strip=True)
        if not name or _SUPPLEMENTARY_XLS_RE.search(name):
            continue
        books.append({"name": name, "cc_class": current_cc, "url": href})
    return books
