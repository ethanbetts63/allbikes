"""Find diagram sections in other books that carry the same parts.

Roughly 16% of sections have a counterpart in another model holding the same
part numbers: 196 sections have an exact twin and a further 109 are wholly
contained in a larger section elsewhere. Surfacing that lets a customer who is
unsure which book their bike takes see that, for this diagram at least, the
choice makes no difference.

Two relations are reported, and they are not the same claim:

``identical``
    The two sections list exactly the same part numbers.
``contained``
    Every part in this section also appears in the other one, which has more
    besides. Anything orderable here is orderable there.

This is a statement about part numbers printed in books, not about fitment.
"""

from __future__ import annotations

from collections import defaultdict

from parts.models import SectionPart

# Below this a match is coincidence rather than a shared assembly - a
# two-bolt section matches half the catalogue and tells a customer nothing.
MINIMUM_PARTS = 3


def _part_numbers_by_section(section_ids):
    parts = defaultdict(set)
    rows = SectionPart.objects.filter(section_id__in=section_ids).values_list(
        "section_id", "part__part_number"
    )
    for section_id, part_number in rows:
        parts[section_id].add(part_number)
    return parts


def equivalent_sections_for(sections):
    """Map each given section id to the equivalent sections in other books.

    ``sections`` is an iterable of ``PartSection`` belonging to one model.
    Runs in a fixed number of queries regardless of how many sections are
    passed, so a whole model costs the same as a single diagram.
    """
    sections = list(sections)
    if not sections:
        return {}
    model_id = sections[0].parts_model_id
    own = _part_numbers_by_section([s.id for s in sections])
    wanted = {s.id: own.get(s.id, set()) for s in sections if len(own.get(s.id, set())) >= MINIMUM_PARTS}
    if not wanted:
        return {}

    universe = set().union(*wanted.values())
    # Every section in another book that shares at least one of these parts.
    candidate_rows = (
        SectionPart.objects.filter(part__part_number__in=universe)
        .exclude(section__parts_model_id=model_id)
        .filter(section__parts_model__is_active=True)
        .values_list(
            "section_id",
            "part__part_number",
            "section__code",
            "section__name",
            "section__parts_model__name",
            "section__parts_model__model_code",
            "section__parts_model__slug",
        )
    )
    overlap = defaultdict(set)
    candidate_meta = {}
    for section_id, part_number, code, name, model_name, model_code, slug in candidate_rows:
        overlap[section_id].add(part_number)
        candidate_meta[section_id] = (code, name, model_name, model_code, slug)
    if not overlap:
        return {}

    # A candidate's own size decides identical vs merely containing.
    sizes = {
        section_id: len(numbers)
        for section_id, numbers in _part_numbers_by_section(list(overlap)).items()
    }

    results = {}
    for section_id, numbers in wanted.items():
        matches = []
        for candidate_id, shared in overlap.items():
            # Only parts from *this* section were fetched, so a full overlap
            # means the candidate contains all of them.
            if len(shared & numbers) != len(numbers):
                continue
            candidate_size = sizes.get(candidate_id, 0)
            code, name, model_name, model_code, slug = candidate_meta[candidate_id]
            matches.append(
                {
                    "relation": "identical" if candidate_size == len(numbers) else "contained",
                    "section_code": code,
                    "section_name": name,
                    "part_count": candidate_size,
                    "model_name": model_name,
                    "model_code": model_code,
                    "model_slug": slug,
                }
            )
        if matches:
            results[section_id] = sorted(
                matches,
                key=lambda m: (m["relation"] != "identical", m["model_name"], m["section_code"]),
            )
    return results
