"""How the parts catalogue overlaps between books.

Three questions, all answered from ``SectionPart``, kept together because they
share the same shape and the same caveat: a shared part number is a statement
about what the books print, never a fitment guarantee.

The headline one finds diagram sections in other books carrying exactly the
same parts.

Around 196 of the catalogue's 1,910 sections have an exact twin in another
model. Surfacing that lets a customer who is unsure which book their bike
takes see that, for this diagram at least, the choice makes no difference.

Only exact matches count. A section whose parts are merely a subset of a
larger one elsewhere is deliberately not reported: the two diagrams are not
interchangeable, and saying so invites a customer to order from the wrong
book.

This is a statement about part numbers printed in books, not about fitment.
"""

from __future__ import annotations

from collections import defaultdict

from django.db.models import Count

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
    """Map each given section id to the identical sections in other books.

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

    # A candidate's own size is what separates an exact twin from a larger
    # section that merely happens to contain these parts.
    sizes = {
        section_id: len(numbers)
        for section_id, numbers in _part_numbers_by_section(list(overlap)).items()
    }

    results = {}
    for section_id, numbers in wanted.items():
        matches = []
        for candidate_id, shared in overlap.items():
            # Only parts from *this* section were fetched, so a full overlap
            # plus an equal size means the two sections list the same parts.
            if len(shared & numbers) != len(numbers):
                continue
            if sizes.get(candidate_id, 0) != len(numbers):
                continue
            code, name, model_name, model_code, slug = candidate_meta[candidate_id]
            matches.append(
                {
                    "section_code": code,
                    "section_name": name,
                    "model_name": model_name,
                    "model_code": model_code,
                    "model_slug": slug,
                }
            )
        if matches:
            results[section_id] = sorted(
                matches, key=lambda m: (m["model_name"], m["section_code"])
            )
    return results


def models_sharing_parts_with(model):
    """Return the five active books sharing the most distinct part numbers.

    Percentages are deliberately relative to the viewed book, so a customer
    can read them as "what portion of this bike's parts also appears in the
    other book?" A shared part number is useful discovery information, not
    a guarantee that every part in either book fits the other vehicle.
    """
    source_part_ids = SectionPart.objects.filter(section__parts_model=model).values("part_id")
    source_part_count = source_part_ids.distinct().count()
    if source_part_count == 0:
        return []

    overlaps = (
        SectionPart.objects.filter(
            part_id__in=source_part_ids,
            section__parts_model__is_active=True,
        )
        .exclude(section__parts_model_id=model.id)
        .values(
            "section__parts_model__name",
            "section__parts_model__model_code",
            "section__parts_model__slug",
        )
        .annotate(shared_part_count=Count("part_id", distinct=True))
        .order_by(
            "-shared_part_count",
            "section__parts_model__name",
            "section__parts_model__model_code",
        )[:5]
    )
    return [
        {
            "name": overlap["section__parts_model__name"],
            "model_code": overlap["section__parts_model__model_code"],
            "slug": overlap["section__parts_model__slug"],
            "shared_part_count": overlap["shared_part_count"],
            "shared_part_percentage": round(100 * overlap["shared_part_count"] / source_part_count, 1),
        }
        for overlap in overlaps
    ]


def models_using_each_part_in(section):
    """Map each part number in this section to the other books that use it.

    Parts are shared across books by design - about 40% of the catalogue
    appears in more than one - so this is a plain statement of where else the
    same part number is printed. One query for the whole section rather than
    one per part.
    """
    numbers = [sp.part.part_number for sp in section.parts.all()]
    if not numbers:
        return {}
    rows = (
        SectionPart.objects.filter(
            part__part_number__in=numbers,
            section__parts_model__is_active=True,
        )
        .exclude(section__parts_model_id=section.parts_model_id)
        .values_list(
            "part__part_number",
            "section__parts_model__name",
            "section__parts_model__model_code",
            "section__parts_model__slug",
        )
        .distinct()
    )
    shared = {}
    for part_number, name, model_code, slug in rows:
        shared.setdefault(part_number, {})[slug] = {
            "name": name,
            "model_code": model_code,
            "slug": slug,
        }
    return {
        number: sorted(models.values(), key=lambda m: (m["name"], m["model_code"]))
        for number, models in shared.items()
    }
