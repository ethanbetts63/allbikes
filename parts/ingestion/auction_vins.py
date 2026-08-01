"""Decode real Australian SYM VINs harvested from vehicle auction listings.

Auction houses publish what the government approval records mask: the actual
17 characters stamped on a bike that was really sold here.  That makes these
the only source able to *correct* the RVCS typical-VIN templates, several of
which have turned out to be wrong at position 9.

Two cautions are built in rather than left to the reader:

* Listings are transcribed by hand, and ``S``/``5`` are visually confusable in
  a stamped VIN.  Both are valid VIN characters, so neither can be rejected —
  but a family seen with both is flagged rather than silently merged.
* A listing's stated year is the seller's description, not the VIN.  Where the
  two disagree the VIN is reported as the decoded year and the disagreement is
  preserved.
"""

from __future__ import annotations

import re
from dataclasses import asdict, dataclass

from parts.ingestion.rvcs_documents import vin_model_year


# ISO 3779 excludes I, O and Q so they can never be confused with 1 and 0.
VIN_CHARS = "ABCDEFGHJKLMNPRSTUVWXYZ0123456789"
VIN_LENGTH = 17
SYM_WMI = ("RFG", "LXM")


class AuctionVinError(ValueError):
    """A harvested VIN is not usable as evidence."""


def normalise_vin(value):
    return re.sub(r"[^A-Z0-9]", "", (value or "").upper())


def validate_vin(value):
    """Return ``(vin, problem)`` — exactly one of the two is set.

    Transcription faults are common in this source, so a bad VIN is reported
    with the reason rather than dropped, which keeps the harvest auditable.
    """
    vin = normalise_vin(value)
    if not vin:
        return "", "empty"
    if len(vin) != VIN_LENGTH:
        return "", f"length {len(vin)}, expected {VIN_LENGTH}"
    bad = sorted({ch for ch in vin if ch not in VIN_CHARS})
    if bad:
        return "", f"contains non-VIN character(s) {''.join(bad)}"
    if not vin.startswith(SYM_WMI):
        return "", f"manufacturer identifier {vin[:3]} is not SYM"
    # The department's VIN guidance states the last three characters must be
    # numbers, which catches a transcribed letter in the serial.
    if not vin[-3:].isdigit():
        return "", f"last three characters {vin[-3:]} are not all numbers"
    return vin, ""


@dataclass(frozen=True)
class AuctionVin:
    source: str
    listing_title: str
    listed_year: object
    vin_prefix: str
    wmi: str
    model_family: str
    position_9: str
    position_11: str
    decoded_year: object
    year_agrees: str
    engine_number: str
    source_url: str
    notes: str
    problem: str

    def as_row(self):
        row = asdict(self)
        row["listed_year"] = self.listed_year or ""
        row["decoded_year"] = self.decoded_year or ""
        return row


def _integer(value):
    try:
        return int(str(value).strip())
    except (TypeError, ValueError):
        return None


def read_observation(row):
    """Turn one curated auction observation into a decoded, validated record.

    Only the first 11 characters are retained.  The serial identifies an
    individual person's vehicle and is not needed for any question here.
    """
    vin, problem = validate_vin(row.get("vin"))
    listed = _integer(row.get("listed_year"))
    decoded = vin_model_year(vin, issue_year=listed or 2030) if vin else None
    if decoded is not None and not (1995 <= decoded <= 2030):
        decoded, problem = None, problem or f"decoded year {decoded} implausible"
    if listed and decoded:
        agrees = "exact" if listed == decoded else f"differs by {decoded - listed:+d}"
    else:
        agrees = ""
    return AuctionVin(
        source=(row.get("source") or "").strip(),
        listing_title=" ".join((row.get("listing_title") or "").split()),
        listed_year=listed,
        vin_prefix=vin[:11],
        wmi=vin[:3],
        model_family=vin[3:9],
        position_9=vin[8] if vin else "",
        position_11=vin[10] if vin else "",
        decoded_year=decoded,
        year_agrees=agrees,
        engine_number=(row.get("engine_number") or "").strip(),
        source_url=(row.get("source_url") or "").strip(),
        notes=" ".join((row.get("notes") or "").split()),
        problem=problem,
    )


def confusable_families(records):
    """Return VIN families seen with both ``S`` and ``5`` at position 11.

    Those two characters are near-identical in a stamped VIN, so a family
    appearing with both is more likely one transcription error than two
    genuine build variants.
    """
    seen = {}
    for record in records:
        if not record.model_family or not record.position_11:
            continue
        seen.setdefault(record.model_family, set()).add(record.position_11)
    return sorted(
        family for family, chars in seen.items() if {"S", "5"} <= chars
    )


def position_9_by_family(records):
    """Map each VIN family to the position-9 characters actually observed.

    Position 9 has repeatedly been over-generalised in this project.  It is a
    per-family variant slot: a constant ``8`` in the older families, part of
    the model code in others (``HV15WC``), and something else again elsewhere
    (``AW12W`` shows both ``8`` and ``Y``).  Reporting it per family keeps that
    visible instead of inviting another universal rule.
    """
    families = {}
    for record in records:
        if record.problem or not record.model_family:
            continue
        families.setdefault(record.model_family[:5], set()).add(record.position_9)
    return {family: sorted(chars) for family, chars in sorted(families.items())}
