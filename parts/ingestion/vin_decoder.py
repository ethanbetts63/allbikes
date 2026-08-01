"""Deprecated home for the VIN decoder; it now lives in :mod:`parts.vin`.

Kept so research scripts and tests that import from here keep working.
"""

from parts.vin import (  # noqa: F401
    CAPACITY_CLASS,
    CAPACITY_TOLERANCE,
    SYM_WMI,
    VinDecode,
    book_capacity,
    decode,
)
