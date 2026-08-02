from datetime import date
from decimal import Decimal
import hashlib
from io import BytesIO
from unittest.mock import patch

import pytest
from django.core.files.base import ContentFile
from django.test import override_settings
from PIL import Image

from parts.ingestion.importer import resolve_display_name, import_book, import_pricing
from parts.models import Part, PartsModel, PartSection, SectionPart

pytestmark = pytest.mark.django_db


@pytest.fixture(autouse=True)
def isolated_media_root(tmp_path):
    """Keep test diagrams out of the real curated-diagrams folder."""
    with override_settings(MEDIA_ROOT=tmp_path):
        yield


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


def _png_bytes(colour):
    image = Image.new("RGB", (4, 4), colour)
    output = BytesIO()
    image.save(output, format="PNG")
    return output.getvalue()


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

    def test_unchanged_source_diagram_keeps_a_reviewed_crop(self):
        parsed = _parsed()
        parsed["sections"][0]["diagram_bytes"] = _png_bytes("red")
        model = import_book(parsed, name="Classic 150", cc_class="100_165")
        section = model.sections.get(code="E01")
        section.curated_diagram_image.save("reviewed.png", ContentFile(_png_bytes("blue")), save=False)
        section.curated_source_hash = section.diagram_source_hash
        section.save()

        import_book(parsed, name="Classic 150", cc_class="100_165")

        section.refresh_from_db()
        assert section.curated_diagram_image
        assert section.curated_source_hash == section.diagram_source_hash

    def test_source_diagram_is_stored_as_webp_without_changing_its_source_hash(self):
        parsed = _parsed()
        source_bytes = _png_bytes("red")
        parsed["sections"][0]["diagram_bytes"] = source_bytes

        model = import_book(parsed, name="Classic 150", cc_class="100_165")
        section = model.sections.get(code="E01")

        assert section.diagram_image.name.endswith(".webp")
        with section.diagram_image.open("rb") as image:
            assert image.read(4) == b"RIFF"
        assert section.diagram_source_hash == hashlib.sha256(source_bytes).hexdigest()

    def test_changed_source_diagram_clears_a_reviewed_crop(self):
        parsed = _parsed()
        parsed["sections"][0]["diagram_bytes"] = _png_bytes("red")
        model = import_book(parsed, name="Classic 150", cc_class="100_165")
        section = model.sections.get(code="E01")
        section.curated_diagram_image.save("reviewed.png", ContentFile(_png_bytes("blue")), save=False)
        section.curated_source_hash = section.diagram_source_hash
        section.save()
        parsed["sections"][0]["diagram_bytes"] = _png_bytes("green")

        import_book(parsed, name="Classic 150", cc_class="100_165")

        section.refresh_from_db()
        assert not section.curated_diagram_image
        assert section.curated_source_hash == ""

    def test_removing_a_section_deletes_its_curated_diagram(self, django_capture_on_commit_callbacks):
        parsed = _parsed()
        parsed["sections"][0]["diagram_bytes"] = _png_bytes("red")
        model = import_book(parsed, name="Classic 150", cc_class="100_165")
        section = model.sections.get(code="E01")
        section.curated_diagram_image.save("reviewed.png", ContentFile(_png_bytes("blue")), save=True)
        curated_name = section.curated_diagram_image.name
        parsed["sections"] = []

        storage = PartSection._meta.get_field("diagram_image").storage
        with patch.object(storage, "delete") as delete:
            with django_capture_on_commit_callbacks(execute=True):
                import_book(parsed, name="Classic 150", cc_class="100_165")

        assert not model.sections.exists()
        assert any(call.args == (curated_name,) for call in delete.call_args_list)


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

    def test_part_numbers_match_case_insensitively_without_duplicates(self):
        Part.objects.create(
            part_number='1640A-XJA-000',
            base_part_number='1640A-XJA-000',
        )

        applied = import_pricing([{
            'part_number': '1640a-XJA-000',
            'description': 'ECU SET',
            'available': 1,
            'price': Decimal('600.00'),
        }])

        assert applied == 1
        assert Part.objects.filter(part_number='1640A-XJA-000').count() == 1
        part = Part.objects.get(part_number='1640A-XJA-000')
        assert part.wholesale_price_incl_gst == Decimal('600.00')


# --- display names ---------------------------------------------------------

class TestResolveDisplayName:
    """The source page sometimes labels a book with only its own model code."""

    def test_a_real_page_label_is_kept(self):
        assert resolve_display_name("Classic 150", "AX15W2-6") == "Classic 150"
        assert resolve_display_name("HD2", "LC18W1-6") == "HD2"
        assert resolve_display_name("2022 Maxsym400i", "LZ40W1-EU") == "2022 Maxsym400i"

    def test_a_label_that_is_only_the_code_falls_back_to_the_book(self):
        # "(AV05W-8)" tells a customer nothing the code column doesn't already.
        assert resolve_display_name("(AV05W-8)", "AV05W-8", "ORBIT 50") == "ORBIT 50"
        assert resolve_display_name("", "BS05W-8", "SHARK 50") == "SHARK 50"

    def test_a_short_trailing_qualifier_does_not_count_as_a_name(self):
        assert resolve_display_name("(LX40A2-6 L4C)", "ZZ99W-1", "Some Book") == "Some Book"

    def test_an_override_wins_over_everything(self):
        # Both Maxsym books are labelled with nothing but their codes.
        assert resolve_display_name("(LX40A2-6 L4C)", "LX40A2-6", "MAXSYM 400") == "Maxsym 400i ABS"
        assert resolve_display_name("(LX40A4-EU)", "LX40A4-EU", "") == "Maxsym 400i ABS"

    def test_with_nothing_available_the_code_is_used(self):
        assert resolve_display_name("", "ZZ99W-1", "") == "ZZ99W-1"
