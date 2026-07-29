"""Stable, human-readable identifiers for catalogue fitments."""


def build_fitment_key(*, model_code, section_code, ref_number, part_number, effective_date=None, occurrence=1):
    """Return the natural identity of one row in a SYM parts book.

    Database ids are deliberately excluded: book re-imports must not invalidate
    carts or order links. ``occurrence`` only distinguishes genuinely duplicated
    source rows and is stable because the book row order is stable.
    """
    date_key = effective_date.isoformat() if effective_date else "original"
    key = ":".join((
        str(model_code).strip(),
        str(section_code).strip(),
        str(ref_number).strip(),
        str(part_number).strip(),
        date_key,
    ))
    return key if occurrence == 1 else f"{key}:{occurrence}"
