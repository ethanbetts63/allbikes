from datetime import date
from decimal import Decimal

import pytest

from parts.ingestion.importer import import_book, import_pricing
from parts.models import Part, PartsModel, PartSection, SectionPart

pytestmark = pytest.mark.django_db


def _parsed(model_code="AX15W2-6"):
    return {
        "model_code": model_code,
        "model_name_hint": "FIDDLE II",
        "colour_index": {},
        "sections": [
            {
                "code": "E01",
                "group": "engine",
                "name": "Shroud Assy",
                "sort_order": 0,
                "diagram_bytes": None,
                "parts": [
                    {
                        "ref_number": "1", "part_number": "1961A-F6A-000",
                        "description": "Fan Cover Assy", "quantity": 1,
                        "effective_date": None, "superseded_flag": "", "sort_order": 0,
                        "base_part_number": "1961A-F6A-000", "colour_suffix": "",
                        "paint_code": "", "colour_name": "",
                    },
                    {
                        "ref_number": "6", "part_number": "53205-ALA-000-RD",
                        "description": "FR. Handle Cover(R-010CA)", "quantity": 1,
                        "effective_date": date(2013, 5, 1), "superseded_flag": "Y", "sort_order": 1,
                        "base_part_number": "53205-ALA-000", "colour_suffix": "RD",
                        "paint_code": "R-010CA", "colour_name": "Red",
                    },
                ],
            }
        ],
    }


class TestImportBook:
    def test_creates_model_sections_parts(self):
        model = import_book(_parsed(), name="Classic 150", cc_class="100_165")
        assert model.model_code == "AX15W2-6"
        assert model.cc_class == "100_165"
        assert model.slug
        assert model.sections.count() == 1
        assert SectionPart.objects.filter(section__parts_model=model).count() == 2
        colour_part = Part.objects.get(part_number="53205-ALA-000-RD")
        assert colour_part.base_part_number == "53205-ALA-000"
        assert colour_part.colour_name == "Red"

    def test_reimport_is_idempotent_and_preserves_natural_identities(self):
        model = import_book(_parsed(), name="Classic 150", cc_class="100_165")
        section_id = model.sections.get(code='E01').id
        fitments = dict(model.sections.get(code='E01').parts.values_list('fitment_key', 'id'))
        import_book(_parsed(), name="Classic 150", cc_class="100_165")
        assert PartsModel.objects.filter(model_code="AX15W2-6").count() == 1
        assert PartSection.objects.filter(parts_model__model_code="AX15W2-6").count() == 1
        # Parts persist (PROTECT), not duplicated.
        assert Part.objects.filter(part_number="53205-ALA-000-RD").count() == 1
        model.refresh_from_db()
        assert model.sections.get(code='E01').id == section_id
        assert dict(model.sections.get(code='E01').parts.values_list('fitment_key', 'id')) == fitments

    def test_no_model_code_raises(self):
        parsed = _parsed(model_code="")
        with pytest.raises(ValueError):
            import_book(parsed, name="x", cc_class="50")


class TestImportPricing:
    def test_applies_price_and_availability(self):
        import_book(_parsed(), name="Classic 150", cc_class="100_165")
        rows = [
            {"part_number": "53205-ALA-000-RD", "description": "FR. Handle Cover(R-010CA)",
             "available": 0, "price": Decimal("143.00")},
            {"part_number": "1961A-F6A-000", "description": "Fan Cover Assy",
             "available": 5, "price": Decimal("60.00")},
        ]
        applied = import_pricing(rows)
        assert applied == 2
        p = Part.objects.get(part_number="53205-ALA-000-RD")
        assert p.wholesale_price_incl_gst == Decimal("143.00")
        assert p.available_qty == 0
        assert p.in_pa_feed is True
        assert p.is_orderable is True  # backorderable: priced + in feed, 0 stock

    def test_missing_parts_flipped_out_of_feed(self):
        import_book(_parsed(), name="Classic 150", cc_class="100_165")
        import_pricing([
            {"part_number": "1961A-F6A-000", "description": "Fan Cover Assy",
             "available": 5, "price": Decimal("60.00")},
        ])
        # A second feed that omits the fan cover marks it not-in-feed.
        import_pricing([
            {"part_number": "53205-ALA-000-RD", "description": "x", "available": 1, "price": Decimal("1.00")},
        ])
        assert Part.objects.get(part_number="1961A-F6A-000").in_pa_feed is False
