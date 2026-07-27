"""Upsert parsed book/pricing data into the catalog models."""
import logging

from django.core.files.base import ContentFile
from django.db import transaction
from django.utils import timezone
from django.utils.text import slugify

from parts.ingestion import colour as colour_mod
from parts.models import Part, PartsModel, PartSection, SectionPart

logger = logging.getLogger(__name__)


def _diagram_extension(data):
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return "png"
    return "jpg"


def _unique_slug(name, model_code):
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
    """Upsert one parsed book. Replaces the model's sections/parts (delete +
    recreate); ``Part`` rows persist (PROTECT) so pricing is never cascade-deleted.
    Returns the ``PartsModel``.
    """
    model_code = parsed["model_code"]
    if not model_code:
        raise ValueError("Book has no model code; refusing to import.")

    display_name = name or parsed.get("model_name_hint") or model_code
    model, _ = PartsModel.objects.get_or_create(
        model_code=model_code,
        defaults={"name": display_name, "cc_class": cc_class or "100_165"},
    )
    model.name = display_name
    if cc_class:
        model.cc_class = cc_class
    if not model.slug:
        model.slug = _unique_slug(display_name, model_code)
    model.source_xls_url = source_url or model.source_xls_url
    model.source_filename = source_filename or model.source_filename
    model.book_hash = book_hash or model.book_hash
    model.last_ingested_at = timezone.now()
    model.is_active = True
    model.save()

    # Replace sections + section parts for this model. ImageField files do not
    # automatically disappear when their rows are deleted, so remove the old
    # diagrams after a successful transaction as well.
    old_diagram_names = [
        section.diagram_image.name for section in model.sections.exclude(diagram_image='')
        if section.diagram_image
    ]
    model.sections.all().delete()

    for sec in parsed["sections"]:
        section = PartSection.objects.create(
            parts_model=model,
            code=sec["code"],
            group=sec["group"],
            name=sec["name"],
            sort_order=sec["sort_order"],
        )
        if sec.get("diagram_bytes"):
            ext = _diagram_extension(sec["diagram_bytes"])
            section.diagram_image.save(
                f"{model_code}_{sec['code']}.{ext}",
                ContentFile(sec["diagram_bytes"]),
                save=True,
            )
        for row in sec["parts"]:
            part = _upsert_book_part(row)
            SectionPart.objects.create(
                section=section,
                part=part,
                ref_number=row["ref_number"],
                description=row["description"],
                quantity=row["quantity"],
                effective_date=row["effective_date"],
                superseded_flag=row["superseded_flag"],
                sort_order=row["sort_order"],
            )

    def delete_old_diagrams():
        storage = PartSection._meta.get_field('diagram_image').storage
        for image_name in old_diagram_names:
            storage.delete(image_name)

    transaction.on_commit(delete_old_diagrams)
    logger.info("Imported book %s (%s): %d sections", display_name, model_code, len(parsed["sections"]))
    return model


def _upsert_book_part(row):
    """Ensure a Part exists for a book row. The book is authoritative for colour
    structure; pricing/description come from the PA feed."""
    part, created = Part.objects.get_or_create(
        part_number=row["part_number"],
        defaults={
            "description": row["description"],
            "base_part_number": row["base_part_number"],
            "colour_suffix": row["colour_suffix"],
            "paint_code": row["paint_code"],
            "colour_name": row["colour_name"],
        },
    )
    if not created:
        # Refresh colour structure from the book (authoritative) without touching
        # PA-sourced pricing.
        part.base_part_number = row["base_part_number"] or part.base_part_number
        part.colour_suffix = row["colour_suffix"] or part.colour_suffix
        part.paint_code = row["paint_code"] or part.paint_code
        part.colour_name = row["colour_name"] or part.colour_name
        if not part.description:
            part.description = row["description"]
        part.save()
    return part


def import_pricing(rows, *, mark_missing_unavailable=True):
    """Apply PA rows to Part price/availability. Returns the number of rows applied.

    Sets ``in_pa_feed=False`` on any Part not present in this feed (discontinued).
    """
    now = timezone.now()
    seen = set()
    applied = 0
    for row in rows:
        pn = row["part_number"]
        seen.add(pn)
        base, suffix = colour_mod.split_base_and_suffix(pn)
        paint_code = colour_mod.parse_paint_code(row["description"])
        part, created = Part.objects.get_or_create(part_number=pn)
        part.description = row["description"] or part.description
        part.wholesale_price_incl_gst = row["price"]
        part.available_qty = row["available"]
        part.in_pa_feed = True
        part.price_updated_at = now
        # Fill colour gaps for PA-only parts without clobbering book-derived data.
        if not part.base_part_number:
            part.base_part_number = pn
        if not part.paint_code and paint_code:
            part.paint_code = paint_code
        if not part.colour_name and paint_code:
            part.colour_name = colour_mod.resolve_colour_name(paint_code)
        part.save()
        applied += 1

    if mark_missing_unavailable and seen:
        Part.objects.exclude(part_number__in=seen).filter(in_pa_feed=True).update(in_pa_feed=False)

    logger.info("Applied pricing to %d parts", applied)
    return applied
