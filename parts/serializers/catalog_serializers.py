"""Serialization for the public parts catalog API.

The section payload is the interesting part: callout rows are grouped by
``ref_number`` into pickers, the variant axis (colour / date / none) is detected,
and the customer price (RRP+GST plus markup) is computed server-side. The source
RRP is never exposed.
"""
from collections import OrderedDict

from rest_framework import serializers

from parts.models import PartsModel, PartSection
from parts.overlap import (
    equivalent_sections_for,
    models_sharing_parts_with,
    models_using_each_part_in,
)


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
        fields = ["name", "model_code", "cc_class", "slug"]


class PartSectionSummarySerializer(serializers.ModelSerializer):
    diagram_thumb = serializers.SerializerMethodField()
    equivalent_sections = serializers.SerializerMethodField()

    class Meta:
        model = PartSection
        fields = ["id", "code", "group", "name", "sort_order", "diagram_thumb", "equivalent_sections"]

    def get_diagram_thumb(self, obj):
        return _image_url(obj.display_diagram_image, self.context.get("request"))

    def get_equivalent_sections(self, obj):
        # Computed once for the whole model and handed down through context,
        # so listing 37 sections costs the same as listing one.
        return self.context.get("equivalent_sections", {}).get(obj.id, [])


class PartsModelDetailSerializer(serializers.ModelSerializer):
    sections = serializers.SerializerMethodField()
    shared_models = serializers.SerializerMethodField()

    class Meta:
        model = PartsModel
        fields = ["name", "model_code", "cc_class", "slug", "last_ingested_at", "sections", "shared_models"]

    def get_sections(self, obj):
        sections = list(obj.sections.all())
        context = {**self.context, "equivalent_sections": equivalent_sections_for(sections)}
        return PartSectionSummarySerializer(sections, many=True, context=context).data

    def get_shared_models(self, obj):
        return models_sharing_parts_with(obj)


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
    shared_models = models_using_each_part_in(section)
    equivalent = equivalent_sections_for([section]).get(section.id, [])

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
        "equivalent_sections": equivalent,
        "enable_new_part_sales": settings.enable_new_part_sales,
        "backorder_hold_days": settings.backorder_hold_days,
        "callouts": callouts,
    }
