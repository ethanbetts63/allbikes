"""Scrape vehicle identity metadata from the EasyParts SYM model hierarchy."""

from __future__ import annotations

import json
import re
import time
from dataclasses import asdict, dataclass
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup


BASE_URL = "https://www.easyparts.com"
START_URL = f"{BASE_URL}/models/Sym-m423"
DEFAULT_DELAY_SECONDS = 3.0
MAX_RATE_LIMIT_RETRIES = 5
REQUEST_HEADERS = {
    # EasyParts serves its public catalogue to normal browsers but rejects the
    # default requests user agent. Keep the headers stable and cache responses.
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/125.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-AU,en;q=0.9",
}

_SYM_MODEL_PATH_RE = re.compile(r"^/models/Sym(?:[^/?#]*)-m(\d+)$", re.I)
_MODEL_CODE_RE = re.compile(r"\b([A-Z]{1,8}\d{2}[A-Z0-9]*-[A-Z0-9]+)\b", re.I)
_YEAR_RANGE_RE = re.compile(r"\b((?:19|20)\d{2})(?:\s*-\s*((?:19|20)\d{2}))?\b")
_PAREN_RE = re.compile(r"\(([^()]*)\)")
_HREF_RE = re.compile(r'href=["\']([^"\']+)["\']', re.I)
_OG_URL_RE = re.compile(
    r'<meta[^>]+property=["\']og:url["\'][^>]+content=["\']([^"\']+)["\']',
    re.I,
)
_STATE_VERSION = 1


@dataclass(frozen=True)
class EasyPartsRelationship:
    customer_name: str
    year_from: int
    year_to: int
    engine: str
    model_code: str
    model_code_raw: str
    generation: str
    frame_number: str
    source_model_id: str
    source_url: str
    source_market: str = "EU"

    def as_row(self):
        return asdict(self)


def _clean_space(value):
    return " ".join((value or "").split())


def _model_id(url):
    match = _SYM_MODEL_PATH_RE.match(urlparse(url).path)
    return match.group(1) if match else ""


def parse_sym_model_links(html):
    """Return canonical EasyParts SYM model links advertised on a page."""
    links = set()
    for href in _HREF_RE.findall(html):
        absolute = urljoin(BASE_URL, href)
        parsed = urlparse(absolute)
        if parsed.netloc.casefold() != urlparse(BASE_URL).netloc.casefold():
            continue
        if _SYM_MODEL_PATH_RE.match(parsed.path):
            links.add(urljoin(BASE_URL, parsed.path))
    return sorted(links, key=lambda url: int(_model_id(url)))


def _source_url_from_html(html, fallback_id):
    match = _OG_URL_RE.search(html)
    if match:
        url = urljoin(BASE_URL, match.group(1))
        if _model_id(url) == fallback_id:
            return url
    return ""


def _write_state(path, *, urls, pending, visited):
    data = {
        "version": _STATE_VERSION,
        "urls": urls,
        "pending": pending,
        "visited": sorted(visited, key=int),
    }
    temporary = path.with_suffix(".tmp")
    temporary.write_text(json.dumps(data, indent=2, sort_keys=True), encoding="utf-8")
    temporary.replace(path)


def _bootstrap_state(cache_dir, *, refresh):
    """Build a fast resumable graph index from cached HTML when needed."""
    state_path = cache_dir / "crawl-state.json"
    if state_path.exists() and not refresh:
        data = json.loads(state_path.read_text(encoding="utf-8"))
        if data.get("version") == _STATE_VERSION:
            return data["urls"], data["pending"], set(data["visited"]), state_path

    urls = {_model_id(START_URL): START_URL}
    cached_ids = set()
    for cache_path in cache_dir.glob("model-*.html"):
        model_id = cache_path.stem.removeprefix("model-")
        if not model_id.isdigit():
            continue
        cached_ids.add(model_id)
        html = cache_path.read_text(encoding="utf-8")
        source_url = _source_url_from_html(html, model_id)
        if source_url:
            urls[model_id] = source_url
        for child_url in parse_sym_model_links(html):
            urls[_model_id(child_url)] = child_url

    visited = set() if refresh else cached_ids
    pending = sorted((model_id for model_id in urls if model_id not in visited), key=int)
    _write_state(state_path, urls=urls, pending=pending, visited=visited)
    return urls, pending, visited, state_path


def _properties(model):
    properties = {}
    children = model.find_all(recursive=False)
    for index, child in enumerate(children[:-1]):
        classes = child.get("class", [])
        if "model_property_name" not in classes:
            continue
        value = children[index + 1]
        if "model_property" not in value.get("class", []):
            continue
        properties[_clean_space(child.get_text(" ", strip=True)).casefold()] = _clean_space(
            value.get_text(" ", strip=True)
        )
    return properties


def parse_model_page(html, source_url):
    """Parse and deduplicate identity records from one EasyParts model page."""
    soup = BeautifulSoup(html, "html.parser")
    source_model_id = _model_id(source_url)
    relationships = {}

    for model in soup.select("#models_table .model"):
        name_element = model.select_one(".model_name")
        if name_element is None:
            continue
        properties = _properties(model)
        year_raw = properties.get("build year", "")
        code_raw = properties.get("model code", "")
        year_match = _YEAR_RANGE_RE.search(year_raw)
        code_match = _MODEL_CODE_RE.search(code_raw)
        if not (year_match and code_match):
            continue

        year_from = int(year_match.group(1))
        year_to = int(year_match.group(2) or year_match.group(1))
        model_code = code_match.group(1).upper()
        generation_values = _PAREN_RE.findall(code_raw[code_match.end() :])
        relationship = EasyPartsRelationship(
            customer_name=_clean_space(name_element.get_text(" ", strip=True)),
            year_from=year_from,
            year_to=year_to,
            engine=properties.get("engine", ""),
            model_code=model_code,
            model_code_raw=code_raw,
            generation=" | ".join(_clean_space(value) for value in generation_values),
            frame_number=properties.get("frame number", ""),
            source_model_id=source_model_id,
            source_url=source_url,
        )
        key = (
            relationship.customer_name,
            relationship.year_from,
            relationship.year_to,
            relationship.engine,
            relationship.model_code_raw,
            relationship.frame_number,
            relationship.source_url,
        )
        relationships[key] = relationship

    return sorted(
        relationships.values(),
        key=lambda item: (item.customer_name.casefold(), item.year_from, item.model_code),
    )


def scrape_sym_hierarchy(
    *,
    cache_dir,
    refresh=False,
    delay_seconds=DEFAULT_DELAY_SECONDS,
    timeout=30,
    max_pages=2000,
    progress=None,
):
    """Crawl the bounded public SYM model hierarchy and return identity rows."""
    cache_dir = Path(cache_dir)
    cache_dir.mkdir(parents=True, exist_ok=True)
    session = requests.Session()
    session.headers.update(REQUEST_HEADERS)
    urls, pending, visited, state_path = _bootstrap_state(cache_dir, refresh=refresh)
    last_request_at = None
    pages_since_checkpoint = 0

    while pending:
        if len(visited) >= max_pages:
            raise RuntimeError(f"EasyParts crawl exceeded the {max_pages}-page safety limit.")
        model_id = pending.pop(0)
        if model_id in visited:
            continue
        url = urls[model_id]
        cache_path = cache_dir / f"model-{model_id}.html"

        try:
            if cache_path.exists() and not refresh:
                html = cache_path.read_text(encoding="utf-8")
            else:
                if last_request_at is not None:
                    remaining = delay_seconds - (time.monotonic() - last_request_at)
                    if remaining > 0:
                        time.sleep(remaining)
                for attempt in range(1, MAX_RATE_LIMIT_RETRIES + 1):
                    response = session.get(url, timeout=timeout)
                    last_request_at = time.monotonic()
                    if response.status_code != 429:
                        break
                    retry_after = response.headers.get("Retry-After", "")
                    try:
                        backoff = float(retry_after)
                    except ValueError:
                        backoff = 30.0 * attempt
                    time.sleep(min(max(backoff, 30.0), 60.0))
                response.raise_for_status()
                html = response.text
                cache_path.write_text(html, encoding="utf-8")
        except Exception:
            pending.insert(0, model_id)
            _write_state(state_path, urls=urls, pending=pending, visited=visited)
            raise

        for child_url in parse_sym_model_links(html):
            child_id = _model_id(child_url)
            if child_id not in urls:
                urls[child_id] = child_url
            if child_id not in visited and child_id not in pending:
                pending.append(child_id)
        visited.add(model_id)
        pages_since_checkpoint += 1
        if pages_since_checkpoint >= 10:
            _write_state(state_path, urls=urls, pending=pending, visited=visited)
            pages_since_checkpoint = 0
        if progress and len(visited) % 25 == 0:
            progress(len(visited), len(pending), None)

    _write_state(state_path, urls=urls, pending=pending, visited=visited)
    relationships = {}
    for cache_path in cache_dir.glob("model-*.html"):
        html = cache_path.read_text(encoding="utf-8")
        if 'id="models_table"' not in html or "model_property_name" not in html:
            continue
        model_id = cache_path.stem.removeprefix("model-")
        source_url = urls.get(model_id) or _source_url_from_html(html, model_id)
        if not source_url:
            continue
        for relationship in parse_model_page(html, source_url):
            key = (
                relationship.model_code,
                relationship.year_from,
                relationship.year_to,
                relationship.engine,
                relationship.model_code_raw,
                relationship.frame_number,
            )
            existing = relationships.get(key)
            if existing is None or (
                existing.customer_name.endswith("...")
                and not relationship.customer_name.endswith("...")
            ):
                relationships[key] = relationship

    return (
        sorted(
            relationships.values(),
            key=lambda item: (item.customer_name.casefold(), item.year_from, item.model_code),
        ),
        len(visited),
    )
