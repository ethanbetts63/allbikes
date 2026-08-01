"""Read Australian motorcycle registration records as model-year evidence.

A state registration extract is the first source in this project that reports
*vehicles that were actually registered here*, with a build year recorded by
the registering authority rather than inferred from a catalogue.  For the
Australian-only ``-8`` books, which no overseas catalogue has ever printed,
this is the closest thing to direct year evidence that exists.

Two limits shape how it is read:

* The ``VIN Prefix`` column holds only five characters — the three-character
  WMI plus the first *two* of the model code.  ``RFGLM`` covers both ``LM25W``
  and ``LM30W``.  So the prefix alone can never identify a book; it is always
  combined with the recorded model name.
* A registration year is when a vehicle was built, not when its parts book was
  issued.  It bounds the model, not the revision, so this stays family
  evidence like every other VIN-derived source here.
"""

from __future__ import annotations

import re
from collections import defaultdict
from dataclasses import asdict, dataclass


SYM_MAKE_TOKENS = ("SYM", "BOLWELL", "SANYANG")
# Registration extracts pad every text column to a fixed width.
_CAPACITY_RE = re.compile(r"(?<!\d)(50|100|110|125|150|160|180|200|250|300|400|500|600)(?!\d)")
EARLIEST_PLAUSIBLE_YEAR = 1990
LATEST_PLAUSIBLE_YEAR = 2030


def clean(value):
    return " ".join(str(value or "").split()).upper()


def is_sym_row(row):
    make = clean(row.get("Make"))
    return any(token in make for token in SYM_MAKE_TOKENS)


def model_capacity(model_name):
    """Return the engine capacity a registration model name implies, if any.

    Capacity is what separates the books that share a VIN prefix: ``MIO 50``
    from ``MIO 100``, ``FIRENZE 250`` from ``FIRENZE 300``.
    """
    match = _CAPACITY_RE.search(clean(model_name))
    return int(match.group(1)) if match else None


def _year(value):
    text = clean(value)
    if not text.isdigit():
        return None
    year = int(text)
    return year if EARLIEST_PLAUSIBLE_YEAR <= year <= LATEST_PLAUSIBLE_YEAR else None


@dataclass(frozen=True)
class RegistrationGroup:
    vin_prefix: str
    make: str
    model: str
    capacity: object
    registration_count: int
    first_year: int
    last_year: int
    observed_years: str
    candidate_local_books: str

    def as_row(self):
        row = asdict(self)
        row["capacity"] = self.capacity or ""
        return row


# A SYM code embeds its capacity in the two digits after the family letters —
# LM"25"W is 250cc, HU"05"W is 50cc.  The figure is nominal, so LA"18"W is
# marketed as a 200 and TB"16"W3 as a 158; matching therefore allows slack
# rather than demanding equality.
_CODE_CAPACITY_RE = re.compile(r"^[A-Z]{2,3}(\d{2})")
# Wide enough for LA18W (180) to match its "LE GRANDE 200" registration at
# 10%, tight enough that LM25W (250) cannot claim a "FIRENZE 300" at 17%.
CAPACITY_TOLERANCE = 0.12


def code_capacity(model_code):
    """Return the nominal capacity a SYM model code encodes, or ``None``."""
    match = _CODE_CAPACITY_RE.match(clean(model_code).split("-")[0])
    return int(match.group(1)) * 10 if match else None


def candidate_books(vin_prefix, capacity, local_models):
    """Match a 5-character VIN prefix and capacity to local parts books.

    ``local_models`` is an iterable of ``(model_code, cc_class)``.  A book
    qualifies when its core code starts with the two model characters the
    prefix exposes.  Where the registration names a capacity, books whose own
    code encodes a materially different one are excluded — that is what
    separates ``LM25W`` from ``LM30W`` behind the shared ``RFGLM``.
    """
    prefix = clean(vin_prefix)
    if len(prefix) < 5:
        return []
    stem = prefix[3:5]
    matches = []
    for entry in local_models:
        code = entry[0] if isinstance(entry, (tuple, list)) else entry
        core = clean(code).split("-")[0]
        if not core.startswith(stem):
            continue
        if capacity is not None:
            encoded = code_capacity(core)
            if encoded and abs(encoded - capacity) > capacity * CAPACITY_TOLERANCE:
                continue
        matches.append(code)
    return sorted(matches)


def group_registrations(rows, local_models=()):
    """Fold raw registration rows into one record per prefix/model pair."""
    local_models = list(local_models)
    buckets = defaultdict(list)
    for row in rows:
        if not is_sym_row(row):
            continue
        year = _year(row.get("Year of Manufacture"))
        if year is None:
            continue
        buckets[(clean(row.get("VIN Prefix")), clean(row.get("Make")), clean(row.get("Model")))].append(year)

    groups = []
    for (prefix, make, model), years in buckets.items():
        distinct = sorted(set(years))
        capacity = model_capacity(model)
        groups.append(
            RegistrationGroup(
                vin_prefix=prefix,
                make=make,
                model=model,
                capacity=capacity,
                registration_count=len(years),
                first_year=distinct[0],
                last_year=distinct[-1],
                observed_years=", ".join(str(year) for year in distinct),
                candidate_local_books=" | ".join(candidate_books(prefix, capacity, local_models)),
            )
        )
    return sorted(groups, key=lambda g: (-g.registration_count, g.vin_prefix, g.model))
