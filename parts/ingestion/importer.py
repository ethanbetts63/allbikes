"""Upsert parsed book/pricing data into the catalog models."""
import hashlib
import logging
import re

from django.core.files.base import ContentFile
from django.db import transaction
from django.utils import timezone
from django.utils.text import slugify

from parts.ingestion import colour as colour_mod
from parts.keys import build_fitment_key, normalize_part_number
from parts.models import Part, PartsModel, PartSection, SectionPart

logger = logging.getLogger(__name__)


def _diagram_extension(data):
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return "png"
    return "jpg"


# The source page occasionally labels a book with nothing but its own model
# code, e.g. "(LX40A2-6 L4C)". That is not a name a customer can recognise, so
# these supply one. Keyed by model code because that is the stable identity.
NAME_OVERRIDES = {
    "LX40A2-6": "Maxsym 400i ABS",
    "LX40A4-EU": "Maxsym 400i ABS",
}


def _is_placeholder_name(label, model_code):
    """True when a source-page label carries no name beyond the model code.

    "(LX40A4-EU)" and "(LX40A2-6 L4C)" are labels of this kind: strip the code,
    the brackets and any short trailing qualifier and nothing is left.
    """
    if not label:
        return True
    remainder = re.sub(re.escape(model_code), " ", label, flags=re.I)
    remainder = re.sub(r"[^A-Za-z]+", " ", remainder)
    # A genuine name has a word of real length; "L4C" style qualifiers do not.
    return not any(len(word) > 3 for word in remainder.split())


def resolve_display_name(label, model_code, name_hint=""):
    """Pick the best available display name for a book.

    Preference order: an explicit override, the source-page label, the name the
    book states about itself, and finally the bare code.
    """
    if model_code in NAME_OVERRIDES:
        return NAME_OVERRIDES[model_code]
    if not _is_placeholder_name(label, model_code):
        return label
    return (name_hint or "").strip() or label or model_code


def unique_model_slug(name, model_code):
    base = slugify(f"{name}-{model_code}") or slugify(model_code) or "model"
    slug = base
    n = 1
    qs = PartsModel.objects.filter(model_code=model_code)
    existing = qs.first()
    while PartsModel.objects.filter(slug=slug).exclude(pk=getattr(existing, "pk", None)).exists():
        n += 1
        slug = f"{base}-{n}"
    return slug


@transaction.atomic
def import_book(parsed, *, name=None, cc_class=None, source_url="", source_filename="", book_hash=""):
    """Upsert one parsed book while preserving stable section/fitment identities."""
    model_code = parsed["model_code"]
    if not model_code:
        raise ValueError("Book has no model code; refusing to import.")

    display_name = resolve_display_name(name, model_code, parsed.get("model_name_hint"))
    model, _ = PartsModel.objects.get_or_create(
        model_code=model_code,
        defaults={"name": display_name, "cc_class": cc_class or "100_165"},
    )
    model.name = display_name
    if cc_class:
        model.cc_class = cc_class
    if not model.slug:
        model.slug = unique_model_slug(display_name, model_code)
    model.source_xls_url = source_url or model.source_xls_url
    model.source_filename = source_filename or model.source_filename
    model.book_hash = book_hash or model.book_hash
    model.last_ingested_at = timezone.now()
    model.is_active = True
    model.save()

    retained_section_ids = []
    obsolete_diagram_names = []
    for sec in parsed["sections"]:
        section, _ = PartSection.objects.update_or_create(
            parts_model=model,
            code=sec["code"],
            defaults={
                "group": sec["group"],
                "name": sec["name"],
                "sort_order": sec["sort_order"],
            },
        )
        retained_section_ids.append(section.id)
        if sec.get("diagram_bytes"):
            source_hash = hashlib.sha256(sec["diagram_bytes"]).hexdigest()
            if source_hash != section.diagram_source_hash:
                old_diagram_name = section.diagram_image.name if section.diagram_image else ""
                old_curated_name = section.curated_diagram_image.name if section.curated_diagram_image else ""
                ext = _diagram_extension(sec["diagram_bytes"])
                section.diagram_image.save(
                    f"{model_code}_{sec['code']}.{ext}",
                    ContentFile(sec["diagram_bytes"]),
                    save=False,
                )
                section.diagram_source_hash = source_hash
                section.curated_diagram_image = None
                section.curated_source_hash = ""
                section.save()
                if old_diagram_name and old_diagram_name != section.diagram_image.name:
                    obsolete_diagram_names.append(old_diagram_name)
                if old_curated_name:
                    obsolete_diagram_names.append(old_curated_name)

        retained_fitment_keys = []
        occurrences = {}
        for row in sec["parts"]:
            part = _upsert_book_part(row)
            base_key = build_fitment_key(
                model_code=model_code,
                section_code=sec["code"],
                ref_number=row["ref_number"],
                part_number=part.part_number,
                effective_date=row["effective_date"],
            )
            occurrences[base_key] = occurrences.get(base_key, 0) + 1
            occurrence = occurrences[base_key]
            fitment_key = base_key if occurrence == 1 else f"{base_key}:{occurrence}"
            retained_fitment_keys.append(fitment_key)
            SectionPart.objects.update_or_create(
                fitment_key=fitment_key,
                defaults={
                    "section": section,
                    "part": part,
                    "ref_number": row["ref_number"],
                    "description": row["description"],
                    "quantity": row["quantity"],
                    "effective_date": row["effective_date"],
                    "superseded_flag": row["superseded_flag"],
                    "sort_order": row["sort_order"],
                },
            )
        section.parts.exclude(fitment_key__in=retained_fitment_keys).delete()

    stale_sections = model.sections.exclude(id__in=retained_section_ids)
    obsolete_diagram_names.extend(
        section.diagram_image.name for section in stale_sections.exclude(diagram_image='')
        if section.diagram_image
    )
    stale_sections.delete()

    def delete_old_diagrams():
        storage = PartSection._meta.get_field('diagram_image').storage
        for image_name in obsolete_diagram_names:
            storage.delete(image_name)

    transaction.on_commit(delete_old_diagrams)
    logger.info("Imported book %s (%s): %d sections", display_name, model_code, len(parsed["sections"]))
    return model


def _upsert_book_part(row):
    """Ensure a Part exists for a book row. The book is authoritative for colour
    structure; pricing/description come from the PA feed."""
    part_number = normalize_part_number(row["part_number"])
    part, created = Part.objects.get_or_create(
        part_number=part_number,
        defaults={
            "description": row["description"],
            "base_part_number": normalize_part_number(row["base_part_number"]),
            "colour_suffix": row["colour_suffix"],
            "paint_code": row["paint_code"],
            "colour_name": row["colour_name"],
        },
    )
    if not created:
        # Refresh colour structure from the book (authoritative) without touching
        # PA-sourced pricing.
        part.base_part_number = normalize_part_number(row["base_part_number"]) or part.base_part_number
        part.colour_suffix = row["colour_suffix"] or part.colour_suffix
        part.paint_code = row["paint_code"] or part.paint_code
        part.colour_name = row["colour_name"] or part.colour_name
        if not part.description:
            part.description = row["description"]
        part.save()
    return part


@transaction.atomic
def import_pricing(rows, *, mark_missing_unavailable=True):
    """Apply PA rows to Part price/availability. Returns the number of rows applied.

    Sets ``in_pa_feed=False`` on any Part not present in this feed (discontinued).
    """
    now = timezone.now()
    rows_by_part_number = {
        normalize_part_number(row["part_number"]): row for row in rows
    }
    seen = set(rows_by_part_number)
    existing = {
        normalize_part_number(part_number): part
        for part_number, part in Part.objects.in_bulk(
            seen, field_name='part_number'
        ).items()
    }
    to_create = []
    to_update = []

    for pn, row in rows_by_part_number.items():
        base, suffix = colour_mod.split_base_and_suffix(pn)
        paint_code = colour_mod.parse_paint_code(row["description"])
        part = existing.get(pn)
        if part is None:
            part = Part(part_number=pn)
            to_create.append(part)
        else:
            to_update.append(part)
        part.description = row["description"] or part.description
        part.wholesale_price_incl_gst = row["price"]
        part.available_qty = row["available"]
        part.in_pa_feed = True
        part.price_updated_at = now
        part.updated_at = now
        # Fill colour gaps for PA-only parts without clobbering book-derived data.
        if not part.base_part_number:
            part.base_part_number = base
        if not part.colour_suffix and suffix:
            part.colour_suffix = suffix
        if not part.paint_code and paint_code:
            part.paint_code = paint_code
        if not part.colour_name and paint_code:
            part.colour_name = colour_mod.resolve_colour_name(paint_code)

    Part.objects.bulk_create(to_create, batch_size=1000)
    Part.objects.bulk_update(
        to_update,
        fields=[
            'description', 'wholesale_price_incl_gst', 'available_qty', 'in_pa_feed',
            'price_updated_at', 'updated_at', 'base_part_number', 'colour_suffix',
            'paint_code', 'colour_name',
        ],
        batch_size=1000,
    )

    if mark_missing_unavailable and seen:
        Part.objects.exclude(part_number__in=seen).filter(in_pa_feed=True).update(in_pa_feed=False)

    applied = len(rows_by_part_number)
    logger.info("Applied pricing to %d parts", applied)
    return applied
