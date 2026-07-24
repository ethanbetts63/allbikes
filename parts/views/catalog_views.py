"""Public read API for the parts catalog (no auth)."""
from django.db.models import Q
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from parts.models import Part, PartsModel, PartSection, PartsSettings, SectionPart
from parts.serializers.catalog_serializers import (
    PartsModelDetailSerializer,
    PartsModelListSerializer,
    build_section_payload,
)

SEARCH_LIMIT = 50


class PublicAPIView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]


class PartsModelListView(PublicAPIView):
    def get(self, request):
        qs = PartsModel.objects.filter(is_active=True)
        cc_class = request.query_params.get("cc_class")
        if cc_class:
            qs = qs.filter(cc_class=cc_class)
        data = PartsModelListSerializer(qs, many=True).data
        return Response(data)


class PartsModelDetailView(PublicAPIView):
    def get(self, request, slug):
        model = get_object_or_404(
            PartsModel.objects.prefetch_related("sections"), slug=slug, is_active=True
        )
        return Response(PartsModelDetailSerializer(model, context={"request": request}).data)


class SectionDetailView(PublicAPIView):
    def get(self, request, pk):
        section = get_object_or_404(
            PartSection.objects.select_related("parts_model"), pk=pk
        )
        settings = PartsSettings.get()
        return Response(build_section_payload(section, settings, request=request))


class PartsSearchView(PublicAPIView):
    def get(self, request):
        q = (request.query_params.get("q") or "").strip()
        if len(q) < 2:
            return Response({"query": q, "parts": [], "models": []})

        settings = PartsSettings.get()

        parts_qs = Part.objects.filter(
            Q(part_number__icontains=q) | Q(description__icontains=q)
        ).order_by("part_number")[:SEARCH_LIMIT]
        parts = [self._part_result(p, settings) for p in parts_qs]

        models_qs = PartsModel.objects.filter(
            Q(name__icontains=q) | Q(model_code__icontains=q), is_active=True
        )
        models = PartsModelListSerializer(models_qs, many=True).data

        return Response({"query": q, "parts": parts, "models": models})

    def _part_result(self, part, settings):
        price = settings.apply_markup(part.wholesale_price_incl_gst)
        section_refs = [
            {
                "section_id": sp.section_id,
                "section_code": sp.section.code,
                "section_name": sp.section.name,
                "model_slug": sp.section.parts_model.slug,
                "model_name": sp.section.parts_model.name,
                "ref_number": sp.ref_number,
            }
            for sp in SectionPart.objects.filter(part=part)
            .select_related("section", "section__parts_model")[:10]
        ]
        return {
            "part_number": part.part_number,
            "description": part.description,
            "colour_name": part.colour_name or None,
            "price": str(price) if price is not None else None,
            "orderable": part.is_orderable,
            "sections": section_refs,
        }
