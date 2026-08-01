"""Serialization for the public parts catalog API.

The section payload is the interesting part: callout rows are grouped by
``ref_number`` into pickers, the variant axis (colour / date / none) is detected,
and the customer price (RRP+GST plus markup) is computed server-side. The source
RRP is never exposed.
"""
from collections import OrderedDict

from django.db.models import Count
from rest_framework import serializers

from parts.models import PartsModel, PartSection, SectionPart


def _image_url(image, request):
    if not image:
        return None
    url = image.url
    return request.build_absolute_uri(url) if request else url


class PartsModelListSerializer(serializers.ModelSerializer):
    class Meta:
        model = PartsModel
        fields = ["name", "model_code", "cc_class", "slug", "last_ingested_at"]


class VinLookupModelSerializer(serializers.ModelSerializer):
    """A candidate book, with the years that argue for or against it."""

    class Meta:
        model = PartsModel
        fields = ["name", "model_code", "cc_class", "slug", "confirmed_years"]


class PartSectionSummarySerializer(serializers.ModelSerializer):
    diagram_thumb = serializers.SerializerMethodField()

    class Meta:
        model = PartSection
        fields = ["id", "code", "group", "name", "sort_order", "diagram_thumb"]

    def get_diagram_thumb(self, obj):
        return _image_url(obj.display_diagram_image, self.context.get("request"))


class PartsModelDetailSerializer(serializers.ModelSerializer):
    sections = serializers.SerializerMethodField()
    shared_models = serializers.SerializerMethodField()

    class Meta:
        model = PartsModel
        fields = ["name", "model_code", "cc_class", "slug", "last_ingested_at", "sections", "shared_models"]

    def get_sections(self, obj):
        sections = obj.sections.all()
        return PartSectionSummarySerializer(sections, many=True, context=self.context).data

    def get_shared_models(self, obj):
        """Return the five active books sharing the most distinct part numbers.

        Percentages are deliberately relative to the viewed book, so a customer
        can read them as "what portion of this bike's parts also appears in the
        other book?" A shared part number is useful discovery information, not
        a guarantee that every part in either book fits the other vehicle.
        """
        source_part_ids = SectionPart.objects.filter(section__parts_model=obj).values("part_id")
        source_part_count = source_part_ids.distinct().count()
        if source_part_count == 0:
            return []

        overlaps = (
            SectionPart.objects.filter(
                part_id__in=source_part_ids,
                section__parts_model__is_active=True,
            )
            .exclude(section__parts_model_id=obj.id)
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


def _variant_label(section_part, axis):
    part = section_part.part
    if axis == "colour":
        return part.colour_name or part.colour_suffix or part.paint_code or "Variant"
    if axis == "date":
        if section_part.effective_date:
            return f"from {section_part.effective_date:%b %Y}"
        return "original"
    return ""


def _detect_axis(members):
    if len(members) < 2:
        return "none"
    suffixes = [m.part.colour_suffix for m in members]
    bases = {m.part.base_part_number for m in members}
    if all(suffixes) and len(bases) == 1:
        return "colour"
    if any(m.effective_date for m in members):
        return "date"
    return "none"


def _shared_models_for(section):
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


def _build_variant(section_part, axis, settings, shared_models=None):
    part = section_part.part
    price = settings.apply_markup(part.wholesale_price_incl_gst)
    orderable = part.is_orderable
    return {
        "fitment_key": section_part.fitment_key,
        "part_number": part.part_number,
        "description": section_part.description or part.description,
        "colour_name": part.colour_name or None,
        "paint_code": part.paint_code or None,
        "effective_date": section_part.effective_date,
        "variant_label": _variant_label(section_part, axis),
        "required_quantity": section_part.quantity,
        "price": str(price) if price is not None else None,
        "available_qty": part.available_qty,
        "orderable": orderable,
        "shared_models": (shared_models or {}).get(part.part_number, []),
    }


def build_section_payload(section, settings, request=None):
    """Full section-detail payload: diagram + callout groups with variants."""
    groups = OrderedDict()
    for sp in section.parts.select_related("part").all():
        groups.setdefault(sp.ref_number, []).append(sp)
    shared_models = _shared_models_for(section)

    callouts = []
    for ref_number, members in groups.items():
        axis = _detect_axis(members)
        # colour variants: orderable + named first, then by colour name.
        if axis == "colour":
            members = sorted(
                members,
                key=lambda m: (not m.part.is_orderable, m.part.colour_name or m.part.colour_suffix or ""),
            )
        elif axis == "date":
            members = sorted(members, key=lambda m: (m.effective_date is not None, m.effective_date or ""))
        callouts.append({
            "ref_number": ref_number,
            "callout_label": members[0].description or members[0].part.description,
            "variant_axis": axis,
            "variants": [_build_variant(m, axis, settings, shared_models) for m in members],
        })

    return {
        "id": section.id,
        "code": section.code,
        "group": section.group,
        "name": section.name,
        "model": {
            "name": section.parts_model.name,
            "model_code": section.parts_model.model_code,
            "slug": section.parts_model.slug,
        },
        "diagram_image": _image_url(section.display_diagram_image, request),
        "enable_new_part_sales": settings.enable_new_part_sales,
        "backorder_hold_days": settings.backorder_hold_days,
        "callouts": callouts,
    }
