"""Parse a SYM parts book (.xls) into a structured dict.

Uses ``xlrd`` for the cell tables and :mod:`parts.ingestion.escher_images` for the
section diagrams. Colour attributes are derived via :mod:`parts.ingestion.colour`.
"""
import logging
import re

import xlrd

from . import colour as colour_mod
from .escher_images import extract_diagrams

logger = logging.getLogger(__name__)

SECTION_RE = re.compile(r"^[EF]\d\d$")
_COLOUR_INDEX_RE = re.compile(r"color index$", re.I)
_HEADER_TOKENS = ("PARTS NUMBER", "PARTS  NO", "PART NUMBER")


def _clean(value):
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    return str(value).strip()


def parse_model_code(book):
    """Extract the SYM model code, e.g. 'AX15W2-6'."""
    # Primary: the 'MODEL:XXXX' cell on the No.index sheets.
    for name in book.sheet_names():
        if name.lower().startswith("no.index"):
            sh = book.sheet_by_name(name)
            text = str(sh.cell_value(0, 0)) if sh.nrows and sh.ncols else ""
            m = re.search(r"MODEL[:\s]*([A-Za-z0-9\-]+)", text, re.I)
            if m:
                return m.group(1).strip()
    # Fallback: the model code cell in a section-sheet header row.
    for name in book.sheet_names():
        if SECTION_RE.match(name):
            sh = book.sheet_by_name(name)
            for c in range(sh.ncols):
                text = str(sh.cell_value(0, c))
                m = re.search(r"\b([A-Z]{2}\d{2}[A-Z0-9\-]+)\b", text)
                if m:
                    return m.group(1).strip()
    return ""


def parse_model_name_hint(book):
    """A model display-name hint from a section header, e.g. 'FIDDLE II'.

    The authoritative display name comes from the source page; this is a fallback.
    """
    for name in book.sheet_names():
        if SECTION_RE.match(name):
            sh = book.sheet_by_name(name)
            for c in range(sh.ncols):
                text = str(sh.cell_value(0, c))
                m = re.search(r"\[([^\]]+)\]?", text)
                if m:
                    return m.group(1).strip()
    return ""


def parse_colour_index(book):
    """Build a {paint_code: colour_name} map from the '... color index' sheets.

    Each such sheet has a small header block with rows labelled COLOR (the colour
    word) and CODE (the paint code) in one cell and the value in a later cell.
    Best-effort: any sheet that doesn't parse cleanly is skipped.
    """
    index = {}
    for name in book.sheet_names():
        if not _COLOUR_INDEX_RE.search(name):
            continue
        sh = book.sheet_by_name(name)
        code = ""
        colour = ""
        for r in range(min(sh.nrows, 12)):
            cells = [str(sh.cell_value(r, c)).strip() for c in range(sh.ncols)]
            uppers = [c.upper() for c in cells]
            if "COLOR" in uppers or "COLOUR" in uppers:
                vals = [c for c in cells if c and c.upper() not in ("COLOR", "COLOUR")]
                if vals:
                    colour = vals[-1]
            if "CODE" in uppers:
                vals = [c for c in cells if c and c.upper() != "CODE"]
                if vals:
                    code = vals[-1]
        # Only accept a plausible paint code (letters + digits) and a real word.
        if code and colour and re.match(r"^[A-Z]{1,3}-?\d", code) and colour.isalpha():
            index[code] = colour.title()
    return index


def _find_header_row(sheet):
    for r in range(min(sheet.nrows, 40)):
        for c in range(sheet.ncols):
            cell = str(sheet.cell_value(r, c)).upper().strip()
            if any(tok in cell for tok in _HEADER_TOKENS):
                return r
    return None


def parse_section_parts(sheet, datemode, colour_index):
    """Parse the numbered parts table of one E/F section sheet."""
    header_row = _find_header_row(sheet)
    if header_row is None:
        return []

    rows = []
    for r in range(header_row + 1, sheet.nrows):
        ref = _clean(sheet.cell_value(r, 0))
        part_number = _clean(sheet.cell_value(r, 1)) if sheet.ncols > 1 else ""
        if not part_number:
            continue
        description = _clean(sheet.cell_value(r, 3)) if sheet.ncols > 3 else ""
        qty_raw = _clean(sheet.cell_value(r, 5)) if sheet.ncols > 5 else ""
        try:
            quantity = int(float(qty_raw)) if qty_raw else 1
        except ValueError:
            quantity = 1
        effective_date = None
        if sheet.ncols > 6:
            date_cell = sheet.cell_value(r, 6)
            if isinstance(date_cell, float) and date_cell > 0:
                try:
                    effective_date = xlrd.xldate_as_datetime(date_cell, datemode).date()
                except Exception:
                    effective_date = None
        superseded_flag = (_clean(sheet.cell_value(r, 7)) if sheet.ncols > 7 else "")[:50]
        rows.append({
            "ref_number": ref,
            "part_number": part_number,
            "description": description,
            "quantity": quantity,
            "effective_date": effective_date,
            "superseded_flag": superseded_flag,
            "sort_order": len(rows),
        })

    _annotate_colour(rows, colour_index)
    return rows


def _annotate_colour(rows, colour_index):
    """Set base_part_number / colour_suffix / paint_code / colour_name on rows,
    using per-callout grouping to identify colour variants."""
    by_ref = {}
    for row in rows:
        by_ref.setdefault(row["ref_number"], []).append(row)

    for ref, group in by_ref.items():
        colour_map = colour_mod.derive_colour_group([r["part_number"] for r in group])
        for row in group:
            pn = row["part_number"]
            paint_code = colour_mod.parse_paint_code(row["description"])
            if pn in colour_map:
                base, suffix = colour_map[pn]
            else:
                base, suffix = pn, ""
            row["base_part_number"] = base
            row["colour_suffix"] = suffix
            row["paint_code"] = paint_code
            row["colour_name"] = (
                colour_mod.resolve_colour_name(paint_code, suffix, colour_index)
                if (suffix or paint_code) else ""
            )


def parse_book(path):
    """Parse a book .xls into a structured dict.

    Returns::

        {
            "model_code": str,
            "model_name_hint": str,
            "colour_index": {paint_code: colour_name},
            "sections": [
                {"code", "group", "name", "sort_order", "diagram_bytes", "parts": [...]},
            ],
        }
    """
    book = xlrd.open_workbook(path, formatting_info=False)
    diagrams = {}
    try:
        diagrams = extract_diagrams(path)
    except Exception as exc:  # diagrams are best-effort; never abort the book
        logger.warning("Diagram extraction failed for %s: %s", path, exc)

    colour_index = parse_colour_index(book)
    sections = []
    for name in book.sheet_names():
        if not SECTION_RE.match(name):
            continue
        sheet = book.sheet_by_name(name)
        section_name = _clean(sheet.cell_value(0, 1)) if sheet.ncols > 1 else name
        if not section_name:
            section_name = name
        sections.append({
            "code": name,
            "group": "engine" if name[0] == "E" else "frame",
            "name": section_name,
            "sort_order": len(sections),
            "diagram_bytes": diagrams.get(name),
            "parts": parse_section_parts(sheet, book.datemode, colour_index),
        })

    return {
        "model_code": parse_model_code(book),
        "model_name_hint": parse_model_name_hint(book),
        "colour_index": colour_index,
        "sections": sections,
    }
