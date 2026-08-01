"""Mine dated maintenance activity out of the local SYM parts workbooks.

Every other source in this project describes a *model*.  These workbooks are
the local parts books themselves, and they are the only artifacts that
definitionally carry the full local code — including the ``-8`` suffix that no
overseas catalogue has ever printed.  Their ``part resume`` sheets are change
logs: an item, the page it sits on, the part numbers before and after, and the
dates the change became effective and was recorded.

What this yields is a *document maintenance window*, not a production range. A
book being revised in 2008 shows the book was live in the parts system that
year; it does not show a vehicle was built or sold then.  The two are kept
apart deliberately, and this evidence is written to its own register rather
than into the confirmed-year path.
"""

from __future__ import annotations

import datetime as _datetime
import re
from dataclasses import asdict, dataclass


# Change-log sheets appear under several names across the library, including
# the Chinese 零件履歷 ("parts history") on books that were never relabelled.
RESUME_SHEET_RE = re.compile(r"resume|履歷|revise|design\s*change", re.I)
# A year printed in a sheet name — "2014 color index", "COLOR (2019)",
# "color index 2013.2014" — dates the revision that sheet belongs to.
_SHEET_YEAR_RE = re.compile(r"(?<!\d)((?:19|20)\d{2})(?!\d)")
_MODEL_RE = re.compile(r"MODEL\s*[:：]\s*([A-Z0-9][A-Z0-9\-]*)", re.I)
_STRING_DATE_RE = re.compile(r"^\s*((?:19|20)\d{2})[/.\-](\d{1,2})[/.\-](\d{1,2})")

# Anything outside this window is a stray number, not a workbook date.
EARLIEST_PLAUSIBLE_YEAR = 1995
LATEST_PLAUSIBLE_YEAR = 2030

_HEADER_ALIASES = {
    "effective_date": ("EFFECTIVE DATE",),
    "revise_date": ("REVISE DATE", "REVISED DATE"),
    "change_details": ("CHANGE DETAILS", "CHANGE DETAIL"),
    "page": ("PAGE",),
    "description": ("DESCRIPTION",),
}


def _plausible(year):
    return EARLIEST_PLAUSIBLE_YEAR <= year <= LATEST_PLAUSIBLE_YEAR


def parse_date_cell(value, *, cell_type=None, datemode=0):
    """Return ``YYYY-MM-DD`` for a workbook date cell, else ``""``.

    Dates arrive three ways: a real Excel date cell, a bare serial number left
    over from one, and free text in either ``2008/6/25`` or ``2008.6.5`` form —
    sometimes with a change-request number appended.
    """
    import xlrd

    if cell_type == xlrd.XL_CELL_DATE or (
        isinstance(value, float) and 30000 < value < 60000
    ):
        try:
            parsed = xlrd.xldate_as_datetime(float(value), datemode)
        except Exception:
            return ""
        return parsed.date().isoformat() if _plausible(parsed.year) else ""
    if not isinstance(value, str):
        return ""
    match = _STRING_DATE_RE.match(value)
    if match is None:
        return ""
    year, month, day = (int(part) for part in match.groups())
    if not _plausible(year):
        return ""
    try:
        return _datetime.date(year, month, day).isoformat()
    except ValueError:
        return ""


def parse_resume_model_code(rows):
    """Return the full local code a change-log sheet declares, e.g. ``BL05W5-8``."""
    for row in rows[:6]:
        for cell in row:
            match = _MODEL_RE.search(str(cell))
            if match:
                return match.group(1).strip().upper()
    return ""


def _header_positions(rows):
    for index, row in enumerate(rows[:8]):
        upper = [str(cell).strip().upper() for cell in row]
        if not any("DATE" in cell for cell in upper):
            continue
        positions = {}
        for field, aliases in _HEADER_ALIASES.items():
            for column, cell in enumerate(upper):
                if cell in aliases:
                    positions[field] = column
                    break
        if "effective_date" in positions or "revise_date" in positions:
            return index, positions
    return None, {}


def parse_revision_entries(rows, *, cell_types=None, datemode=0):
    """Read the dated rows of one change-log sheet.

    ``rows`` is a list of cell-value lists; ``cell_types`` mirrors it when the
    caller can supply xlrd's types, which distinguishes a real date cell from a
    number that merely looks like a serial.
    """
    header_index, positions = _header_positions(rows)
    if header_index is None:
        return []
    entries = []
    for row_index in range(header_index + 1, len(rows)):
        row = rows[row_index]
        types = cell_types[row_index] if cell_types else [None] * len(row)

        def value(field):
            column = positions.get(field)
            if column is None or column >= len(row):
                return "", None
            return row[column], (types[column] if column < len(types) else None)

        effective_raw, effective_type = value("effective_date")
        revise_raw, revise_type = value("revise_date")
        effective = parse_date_cell(effective_raw, cell_type=effective_type, datemode=datemode)
        revise = parse_date_cell(revise_raw, cell_type=revise_type, datemode=datemode)
        if not effective and not revise:
            continue
        details, _ = value("change_details")
        page, _ = value("page")
        entries.append(
            {
                "effective_date": effective,
                "revise_date": revise,
                "change_details": str(details).strip(),
                "page": str(page).strip(),
            }
        )
    return entries


def years_in_sheet_names(sheet_names):
    """Return the model years printed in a workbook's sheet names.

    Colour charts are re-issued per model year and the year stays in the tab
    name, so a book carrying "2010 color index" through "2013 color index" was
    maintained across those years.
    """
    years = set()
    for name in sheet_names or []:
        for match in _SHEET_YEAR_RE.findall(str(name)):
            year = int(match)
            if _plausible(year):
                years.add(year)
    return sorted(years)


@dataclass(frozen=True)
class WorkbookRevisionEvidence:
    source_file: str
    declared_model_code: str
    revision_count: int
    first_revision_date: str
    last_revision_date: str
    revision_years: str
    sheet_name_years: str
    all_activity_years: str

    def as_row(self):
        return asdict(self)


def summarise(*, source_file, declared_model_code, entries, sheet_names):
    """Fold one workbook's dated activity into a single reviewable record."""
    dates = sorted(
        {entry[field] for entry in entries for field in ("effective_date", "revise_date") if entry[field]}
    )
    revision_years = sorted({int(date[:4]) for date in dates})
    sheet_years = years_in_sheet_names(sheet_names)
    return WorkbookRevisionEvidence(
        source_file=source_file,
        declared_model_code=declared_model_code,
        revision_count=len(entries),
        first_revision_date=dates[0] if dates else "",
        last_revision_date=dates[-1] if dates else "",
        revision_years=", ".join(str(year) for year in revision_years),
        sheet_name_years=", ".join(str(year) for year in sheet_years),
        all_activity_years=", ".join(
            str(year) for year in sorted(set(revision_years) | set(sheet_years))
        ),
    )
