"""Decode an Australian SYM VIN to the local parts book(s) it can belong to.

This is production code: the public VIN lookup endpoint depends on it, and the
research ingestion modules import the year decoding from here rather than the
other way round.

SYM stamps two different schemes into the vehicle-descriptor section, and
which one you are looking at decides how the book is found.

**Direct scheme** — the descriptor *is* the model code::

    RFG FA05U 8 8 5 000938
        └───┘ │ │
        code  │ └── year of manufacture (ISO 3779 position 10)
              └──── variant slot: meaning differs per family

**Indirect scheme** — used on the newer LXM bikes and on late RFG models,
where the descriptor is a shorthand rather than the code::

    LXM XLA501 R X 012345          book XL20W1-IT
        │││
        ││└─ capacity class digit
        │└── series letter
        └─── first two letters of the model code

The bridge between the two is derivable rather than guessed: the first two
letters carry over unchanged, and the capacity-class digit must agree with the
capacity encoded in the book's own code.  ``XLA5`` is an ``XL`` of about
200 cc, which is ``XL20W1-IT`` and nothing else.

What no scheme carries is the parts-book *revision* — the ``2`` in
``HU05W2-8`` or the ``7`` in ``LH18W7-8``.  Where several books share a family
and differ only by revision, a VIN cannot separate them, and this module
returns all of them rather than picking one.
"""

from __future__ import annotations

import re
from dataclasses import asdict, dataclass



# ISO 3779 position 10 cycles every 30 years: A-Y (omitting I, O, Q, U, Z)
# then 1-9.  A code is therefore genuinely ambiguous — "A" is both 1980 and
# 2010 — so every candidate is kept and the caller's context resolves it.
# The window is capped at 2030 because nothing in this corpus can be later,
# which is what makes the digit codes unambiguous in practice.
_VIN_YEAR_CYCLE = "ABCDEFGHJKLMNPRSTVWXY123456789"
_CORPUS_FIRST_YEAR, _CORPUS_LAST_YEAR = 1980, 2030


def _build_year_codes():
    codes = {}
    for year in range(_CORPUS_FIRST_YEAR, _CORPUS_LAST_YEAR + 1):
        code = _VIN_YEAR_CYCLE[(year - 1980) % len(_VIN_YEAR_CYCLE)]
        codes.setdefault(code, []).append(year)
    return {code: tuple(years) for code, years in codes.items()}


_VIN_YEAR_CODES = _build_year_codes()

# A placeholder stands in for "any year" and must never decode to one.
VIN_YEAR_PLACEHOLDERS = set("#$%*?_0")

def vin_model_year(vin, *, issue_year=None):
    """Decode the model year from position 10 of a typical VIN.

    ``issue_year`` disambiguates the letter codes, which repeat every 30 years.
    Without it, an ambiguous letter returns ``None`` rather than a guess.
    """
    cleaned = re.sub(r"[^A-Z0-9#$%*?_]", "", (vin or "").upper())
    if len(cleaned) < 10:
        return None
    code = cleaned[9]
    if code in VIN_YEAR_PLACEHOLDERS:
        return None
    candidates = sorted(_VIN_YEAR_CODES.get(code, ()))
    if not candidates:
        return None
    if len(candidates) == 1:
        return candidates[0]
    if issue_year is None:
        return None
    # A vehicle is plated at or shortly before its approval, never long after.
    plausible = [year for year in candidates if year <= issue_year + 1]
    return max(plausible) if plausible else None


SYM_WMI = ("RFG", "LXM")

# Capacity class digit observed at position 4 of an indirect descriptor,
# mapped to the nominal capacity it stands for.  Derived from the thirteen
# indirect families seen in real VINs, every one of which agrees with the
# capacity its book code encodes.
CAPACITY_CLASS = {"1": 50, "3": 125, "5": 200, "7": 300, "9": 400}
# TB16W3 registers as class 5 at 160 cc, so the band has to be generous.
CAPACITY_TOLERANCE = 0.30

_DIRECT_RE = re.compile(r"^[A-Z]{2}\d{2}[A-Z]")
_INDIRECT_RE = re.compile(r"^([A-Z]{2})([A-Z])([1-9])\d{2}$")
_BOOK_RE = re.compile(r"^([A-Z]{2,3})(\d{2})")


def book_capacity(model_code):
    """Return the nominal capacity a book's own code encodes."""
    match = _BOOK_RE.match((model_code or "").upper().split("-")[0])
    return int(match.group(2)) * 10 if match else None


@dataclass(frozen=True)
class VinDecode:
    vin_prefix: str
    wmi: str
    descriptor: str
    scheme: str
    model_family: str
    capacity_class: object
    year: object
    book_candidates: tuple
    note: str

    def as_row(self):
        row = asdict(self)
        row["book_candidates"] = " | ".join(self.book_candidates)
        row["capacity_class"] = self.capacity_class or ""
        row["year"] = self.year or ""
        return row


def _direct_candidates(descriptor, books):
    """Books whose code the descriptor spells out directly.

    An exact hit wins outright: ``LXMAE12W4`` is the ``AE12W4`` book and not
    also the ``AE12W1`` one, even though both share the ``AE12W`` family.
    Only when nothing matches exactly does this fall back to the family.
    """
    exact = [code for code in books if code.upper().split("-")[0] == descriptor]
    if exact:
        return sorted(set(exact))
    matches = []
    for code in books:
        core = code.upper().split("-")[0]
        # The descriptor may carry a variant character the book omits, or stop
        # short of the book's revision digit; either way the shared run is the
        # model family.
        if descriptor.startswith(core) or core.startswith(descriptor[:5]):
            matches.append(code)
    return sorted(set(matches))


def _rank_by_year(candidates, year, book_years):
    """Order candidates by whether their documented years include the VIN's.

    This deliberately never drops a candidate.  Every year in this project is
    evidence of *presence* — a source recording that a book existed in a given
    year.  Nothing anywhere records that a book was *not* used in a year, so a
    year missing from a book's list means only that nobody we have read
    mentioned it.  Measured against the family evidence, documented ranges run
    up to thirteen years short at one end, so eliminating a book for failing to
    list the year would be reasoning from an absence that carries no
    information.
    """
    if not year or len(candidates) < 2 or not book_years:
        return candidates, ""
    matching = [code for code in candidates if year in (book_years.get(code) or ())]
    if not matching or len(matching) == len(candidates):
        return candidates, ""
    rest = [code for code in candidates if code not in matching]
    return matching + rest, (
        f"; {', '.join(matching)} documented in {year}, listed first — "
        "the others are not ruled out"
    )


def _indirect_candidates(family, capacity_class, books):
    """Books reachable through the shorthand descriptor.

    The two letters must match and the capacity must be consistent; that pair
    is what makes the mapping a rule instead of a name lookup.
    """
    target = CAPACITY_CLASS.get(capacity_class)
    matches = []
    for code in books:
        if not code.upper().startswith(family):
            continue
        capacity = book_capacity(code)
        if target and capacity and abs(capacity - target) > target * CAPACITY_TOLERANCE:
            continue
        matches.append(code)
    return sorted(set(matches))


def decode(vin, books=(), listed_year=None, book_years=None):
    """Decode a VIN (or its first 10+ characters) to candidate parts books."""
    cleaned = re.sub(r"[^A-Z0-9]", "", (vin or "").upper())
    books = [b.upper() for b in books]
    if len(cleaned) < 10:
        return VinDecode(cleaned[:11], cleaned[:3], "", "unknown", "", None, None, (), "VIN too short to decode")
    wmi, descriptor = cleaned[:3], cleaned[3:9]
    if wmi not in SYM_WMI:
        return VinDecode(cleaned[:11], wmi, descriptor, "unknown", "", None, None, (),
                         f"manufacturer identifier {wmi} is not SYM")

    year = vin_model_year(cleaned, issue_year=listed_year or 2030)
    indirect = _INDIRECT_RE.match(descriptor)
    if indirect and not _DIRECT_RE.match(descriptor):
        family, _series, capacity_class = indirect.groups()
        candidates = _indirect_candidates(family, capacity_class, books)
        note = (
            f"shorthand descriptor: {family} at capacity class {capacity_class} "
            f"(~{CAPACITY_CLASS.get(capacity_class)}cc)"
        )
        scheme = "indirect"
    else:
        family = descriptor[:5]
        capacity_class = None
        candidates = _direct_candidates(descriptor, books)
        note = "descriptor spells the model code directly"
        scheme = "direct"

    candidates, ranked = _rank_by_year(candidates, year, book_years)
    note += ranked
    if not candidates:
        note += "; no local book matches this family"
    elif len(candidates) > 1:
        note += "; several books share this family and differ only by revision, which the VIN does not carry"
    return VinDecode(
        vin_prefix=cleaned[:11],
        wmi=wmi,
        descriptor=descriptor,
        scheme=scheme,
        model_family=family,
        capacity_class=CAPACITY_CLASS.get(capacity_class) if capacity_class else None,
        year=year,
        book_candidates=tuple(candidates),
        note=note,
    )
