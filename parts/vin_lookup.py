"""Resolve a customer's VIN to the parts books it could belong to.

Thin layer over :mod:`parts.vin`: it supplies the live book list and each
book's evidenced years, then turns the decode into something a view can
serialise.  The decoding rules themselves live in ``parts.vin`` and are shared
with the research pipeline.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

from parts.models import PartsModel
from parts.vin import decode

# The decoder only reads the first eleven characters, but the full VIN is
# required anyway: a customer who has transcribed all seventeen has plainly
# read them off the bike, which is the weakest link in the whole lookup.
VIN_LENGTH = 17


@dataclass(frozen=True)
class LookupResult:
    vin: str
    year: object
    model_family: str
    models: list
    problem: str
    note: str

    @property
    def matched(self):
        return bool(self.models)


def normalise(value):
    return re.sub(r"[^A-Z0-9]", "", (value or "").upper())


def validate(value):
    """Return ``(vin, problem)`` for customer input; exactly one is set."""
    vin = normalise(value)
    if not vin:
        return "", "Enter your VIN to find your model."
    if len(vin) != VIN_LENGTH:
        return "", (
            f"A VIN is {VIN_LENGTH} characters - that one has {len(vin)}. "
            "Please enter it in full."
        )
    if set("IOQ") & set(vin):
        return "", "A VIN never contains the letters I, O or Q - check for 1s and 0s."
    return vin, ""


def lookup(value):
    """Decode a customer VIN against the active parts books."""
    vin, problem = validate(value)
    if problem:
        return LookupResult(normalise(value)[:VIN_LENGTH], None, "", [], problem, "")

    active = list(PartsModel.objects.filter(is_active=True))
    by_code = {model.model_code.upper(): model for model in active}
    book_years = {
        model.model_code.upper(): {
            int(year) for year in re.findall(r"\d{4}", model.confirmed_years or "")
        }
        for model in active
        if model.confirmed_years
    }

    result = decode(vin, list(by_code), book_years=book_years or None)
    models = [by_code[code] for code in result.book_candidates if code in by_code]
    problem = ""
    if not models:
        problem = (
            "We couldn't match that VIN to one of our SYM parts books. "
            "It may be a model we don't stock a book for, or a non-SYM bike."
        )
    return LookupResult(
        vin=vin,
        year=result.year,
        model_family=result.model_family,
        models=models,
        problem=problem,
        note=result.note,
    )
