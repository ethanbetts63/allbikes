"""Colour handling for painted body parts.

A painted callout lists several part numbers that share a base and differ by a
trailing colour suffix (e.g. ``53205-ALA-000-RD`` / ``-KG`` / ``-SB``). The paint
code is often embedded in the description, e.g. ``FR. HANDLE COVER(R-010CA)``.
This module derives the base/suffix split, parses the paint code, and resolves a
human colour name (best effort).
"""
import re

# Paint code embedded in a description. It appears either parenthesised, e.g.
# "FR. HANDLE COVER(R-010CA)", or bare at the end, e.g. "FR.COVER BU2957C".
# Shape: 1-3 letters, optional hyphen, 3-4 digits, optional trailing letters.
_CODE = r"[A-Z]{1,3}-?\d{3,4}[A-Z]{0,2}"
_PAINT_CODE_PAREN_RE = re.compile(r"\((" + _CODE + r")\)")
_PAINT_CODE_TRAIL_RE = re.compile(r"\b(" + _CODE + r")\s*$")

# Fallback: paint-code prefix -> colour name, used when the colour index has no
# entry. Prefixes are the leading letters of the paint code (before the digits).
_PREFIX_COLOUR = {
    "R": "Red",
    "RIT": "Red",
    "BK": "Black",
    "BU": "Blue",
    "BQ": "Blue",
    "GN": "Green",
    "WH": "White",
    "YL": "Yellow",
    "S": "Silver",
    "GY": "Grey",
    "BR": "Brown",
    "OR": "Orange",
    "PP": "Purple",
    "PK": "Pink",
}


def parse_paint_code(description):
    """Return the paint code embedded in a description, or '' if none.

    Prefers a parenthesised code (higher confidence); falls back to a bare code at
    the end of the description.
    """
    if not description:
        return ""
    match = _PAINT_CODE_PAREN_RE.search(description)
    if match:
        return match.group(1)
    match = _PAINT_CODE_TRAIL_RE.search(description.strip())
    return match.group(1) if match else ""


def split_base_and_suffix(part_number):
    """Split a part number into (base, suffix) at the final '-' segment.

    e.g. '53205-ALA-000-RD' -> ('53205-ALA-000', 'RD').
    Only meaningful when the base is shared by sibling colour variants; callers
    decide whether to apply it (see :func:`derive_colour_group`).
    """
    if "-" not in part_number:
        return part_number, ""
    base, suffix = part_number.rsplit("-", 1)
    return base, suffix


def derive_colour_group(part_numbers):
    """Given the part numbers under one callout, identify colour variants.

    Returns ``{part_number: (base, suffix)}`` for the members that are colour
    variants (i.e. share a base with at least one sibling). Non-colour parts are
    omitted (their base == part_number, suffix == '').
    """
    bases = {}
    for pn in part_numbers:
        base, suffix = split_base_and_suffix(pn)
        bases.setdefault(base, []).append((pn, suffix))
    result = {}
    for base, members in bases.items():
        if len(members) < 2:
            continue  # a lone part under a base is not a colour group
        for pn, suffix in members:
            result[pn] = (base, suffix)
    return result


def _prefix_of(paint_code):
    match = re.match(r"([A-Z]+)", paint_code)
    return match.group(1) if match else ""


def resolve_colour_name(paint_code, suffix="", colour_index=None):
    """Best-effort human colour name.

    Tries, in order: the book's colour-index map (by paint code), a static map on
    the paint-code prefix, then a static map on the colour suffix's leading
    letters. Returns '' if nothing resolves (the UI falls back to showing the
    suffix/paint code).
    """
    if colour_index and paint_code and paint_code in colour_index:
        return colour_index[paint_code]
    if paint_code:
        prefix = _prefix_of(paint_code)
        if prefix in _PREFIX_COLOUR:
            return _PREFIX_COLOUR[prefix]
    if suffix:
        sprefix = _prefix_of(suffix)
        if sprefix in _PREFIX_COLOUR:
            return _PREFIX_COLOUR[sprefix]
    return ""
