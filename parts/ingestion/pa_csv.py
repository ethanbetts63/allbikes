"""Parse the SYM Price & Availability CSV.

Columns: ``PART NUMBER, DESCRIPTION, AVAILABLE, RRP+GST, ADD GST``.
"""
import csv
import logging
from decimal import Decimal, InvalidOperation

logger = logging.getLogger(__name__)


def _parse_price(raw):
    if raw is None:
        return None
    cleaned = raw.replace("$", "").replace(",", "").strip()
    if not cleaned:
        return None
    try:
        return Decimal(cleaned)
    except InvalidOperation:
        return None


def _parse_int(raw):
    if raw is None:
        return None
    cleaned = raw.strip()
    if not cleaned:
        return None
    try:
        return int(float(cleaned))
    except ValueError:
        return None


def iter_pa_rows(path):
    """Yield ``{part_number, description, available, price}`` for each data row.

    Skips rows without a part number. ``available`` and ``price`` may be None.
    """
    with open(path, newline="", encoding="utf-8-sig", errors="replace") as fh:
        reader = csv.reader(fh)
        header = next(reader, None)  # PART NUMBER, DESCRIPTION, AVAILABLE, RRP+GST, ...
        for row in reader:
            if not row:
                continue
            part_number = row[0].strip()
            if not part_number or part_number.upper() == "PART NUMBER":
                continue
            description = row[1].strip() if len(row) > 1 else ""
            available = _parse_int(row[2]) if len(row) > 2 else None
            price = _parse_price(row[3]) if len(row) > 3 else None
            yield {
                "part_number": part_number,
                "description": description,
                "available": available,
                "price": price,
            }
