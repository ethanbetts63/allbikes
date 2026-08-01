from datetime import date
from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from parts.models import PartsSettings
from parts.tests.factories import (
    PartFactory,
    PartSectionFactory,
    PartsModelFactory,
    SectionPartFactory,
)

pytestmark = pytest.mark.django_db


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def settings_20pct():
    s = PartsSettings.get()
    s.markup_percentage = Decimal("20")
    s.save()
    return s


class TestModelList:
    def test_lists_active_models(self, client):
        PartsModelFactory(name="Classic 150", cc_class="100_165")
        PartsModelFactory(name="Old Model", is_active=False)
        resp = client.get("/api/parts/models/")
        assert resp.status_code == 200
        names = [m["name"] for m in resp.json()]
        assert "Classic 150" in names
        assert "Old Model" not in names

    def test_cc_class_filter(self, client):
        PartsModelFactory(cc_class="50")
        PartsModelFactory(cc_class="atv")
        resp = client.get("/api/parts/models/?cc_class=atv")
        assert all(m["cc_class"] == "atv" for m in resp.json())
        assert len(resp.json()) == 1


class TestModelDetail:
    def test_returns_sections(self, client):
        model = PartsModelFactory()
        PartSectionFactory(parts_model=model, code="E01", name="Shroud Assy")
        resp = client.get(f"/api/parts/models/{model.slug}/")
        assert resp.status_code == 200
        assert resp.json()["sections"][0]["name"] == "Shroud Assy"

    def test_404_for_inactive(self, client):
        model = PartsModelFactory(is_active=False)
        assert client.get(f"/api/parts/models/{model.slug}/").status_code == 404

    def test_lists_the_top_five_models_by_shared_part_overlap(self, client):
        mine = PartsModelFactory(name="Current", model_code="CURRENT-1", slug="current")
        source = PartSectionFactory(parts_model=mine)
        parts = [PartFactory() for _ in range(6)]
        for part in parts:
            SectionPartFactory(section=source, part=part)

        def other_book(index, shared_count, *, active=True):
            other = PartsModelFactory(
                name=f"Other {index}",
                model_code=f"OTHER-{index}",
                slug=f"other-{index}",
                is_active=active,
            )
            section = PartSectionFactory(parts_model=other)
            for part in parts[:shared_count]:
                SectionPartFactory(section=section, part=part)
            return other

        other_book(1, 6)
        other_book(2, 5)
        other_book(3, 4)
        other_book(4, 3)
        other_book(5, 2)
        other_book(6, 1)
        other_book(7, 6, active=False)

        response = client.get(f"/api/parts/models/{mine.slug}/")

        assert response.status_code == 200
        overlaps = response.json()["shared_models"]
        assert [row["model_code"] for row in overlaps] == ["OTHER-1", "OTHER-2", "OTHER-3", "OTHER-4", "OTHER-5"]
        assert [row["shared_part_count"] for row in overlaps] == [6, 5, 4, 3, 2]
        assert [row["shared_part_percentage"] for row in overlaps] == [100.0, 83.3, 66.7, 50.0, 33.3]


class TestSectionDetail:
    def test_sales_setting_is_included_in_section_payload(self, client, settings_20pct):
        section = PartSectionFactory()
        PartsSettings.get().save()
        response = client.get(f"/api/parts/sections/{section.id}/")
        assert response.json()['enable_new_part_sales'] is True
        assert response.json()['backorder_hold_days'] == settings_20pct.backorder_hold_days

        settings = PartsSettings.get()
        settings.enable_new_part_sales = False
        settings.save()
        response = client.get(f"/api/parts/sections/{section.id}/")
        assert response.json()['enable_new_part_sales'] is False
    def test_colour_axis_and_markup(self, client, settings_20pct):
        section = PartSectionFactory()
        base = "53205-ALA-000"
        red = PartFactory(part_number=f"{base}-RD", base_part_number=base, colour_suffix="RD",
                          colour_name="Red", wholesale_price_incl_gst=Decimal("100.00"), available_qty=3)
        blk = PartFactory(part_number=f"{base}-KG", base_part_number=base, colour_suffix="KG",
                          colour_name="Black", wholesale_price_incl_gst=Decimal("100.00"), available_qty=1)
        SectionPartFactory(section=section, ref_number="6", part=red, description="FR Handle Cover")
        SectionPartFactory(section=section, ref_number="6", part=blk, description="FR Handle Cover")

        resp = client.get(f"/api/parts/sections/{section.id}/")
        callout = next(c for c in resp.json()["callouts"] if c["ref_number"] == "6")
        assert callout["variant_axis"] == "colour"
        assert len(callout["variants"]) == 2
        prices = {v["colour_name"]: v["price"] for v in callout["variants"]}
        assert prices["Red"] == "120.00"  # 100 * 1.20
        # wholesale price is never exposed
        assert "wholesale_price_incl_gst" not in callout["variants"][0]

    def test_stock_inputs_are_returned_without_duplicate_policy_flag(self, client, settings_20pct):
        section = PartSectionFactory()
        part = PartFactory(wholesale_price_incl_gst=Decimal("10"), available_qty=0, in_pa_feed=True)
        SectionPartFactory(section=section, ref_number="1", part=part, quantity=1)
        resp = client.get(f"/api/parts/sections/{section.id}/")
        variant = resp.json()["callouts"][0]["variants"][0]
        assert variant["orderable"] is True
        assert variant["available_qty"] == 0
        assert variant["required_quantity"] == 1
        assert "backorder" not in variant

    def test_stable_model_and_section_code_route(self, client, settings_20pct):
        section = PartSectionFactory(code='F05')
        response = client.get(
            f'/api/parts/models/{section.parts_model.slug}/sections/{section.code}/'
        )
        assert response.status_code == 200
        assert response.json()['id'] == section.id

    def test_not_in_feed_is_unorderable(self, client, settings_20pct):
        section = PartSectionFactory()
        part = PartFactory(in_pa_feed=False, wholesale_price_incl_gst=None, available_qty=None)
        SectionPartFactory(section=section, ref_number="1", part=part)
        resp = client.get(f"/api/parts/sections/{section.id}/")
        variant = resp.json()["callouts"][0]["variants"][0]
        assert variant["orderable"] is False
        assert variant["price"] is None

    def test_date_axis(self, client, settings_20pct):
        section = PartSectionFactory()
        old = PartFactory(part_number="18241-H4C-000", wholesale_price_incl_gst=Decimal("9"))
        new = PartFactory(part_number="18241-F6S-000", wholesale_price_incl_gst=Decimal("9"))
        SectionPartFactory(section=section, ref_number="6", part=old, effective_date=None)
        SectionPartFactory(section=section, ref_number="6", part=new, effective_date=date(2013, 5, 1))
        resp = client.get(f"/api/parts/sections/{section.id}/")
        callout = next(c for c in resp.json()["callouts"] if c["ref_number"] == "6")
        assert callout["variant_axis"] == "date"
        labels = [v["variant_label"] for v in callout["variants"]]
        assert "original" in labels
        assert any("from" in lbl for lbl in labels)


class TestSearch:
    def test_part_number_match(self, client, settings_20pct):
        section = PartSectionFactory()
        part = PartFactory(part_number="53205-ALA-000-RD", description="FR Handle Cover",
                           wholesale_price_incl_gst=Decimal("100"))
        SectionPartFactory(section=section, ref_number="6", part=part)
        resp = client.get("/api/parts/search/?q=53205")
        assert resp.status_code == 200
        pns = [p["part_number"] for p in resp.json()["parts"]]
        assert "53205-ALA-000-RD" in pns
        hit = next(p for p in resp.json()["parts"] if p["part_number"] == "53205-ALA-000-RD")
        assert hit["price"] == "120.00"
        assert hit["sections"][0]["section_id"] == section.id

    def test_model_match(self, client):
        PartsModelFactory(name="Classic 150", model_code="AX15W2-6")
        resp = client.get("/api/parts/search/?q=classic")
        assert any(m["name"] == "Classic 150" for m in resp.json()["models"])

    def test_short_query_returns_empty(self, client):
        resp = client.get("/api/parts/search/?q=a")
        assert resp.json()["parts"] == [] and resp.json()["models"] == []


# --- shared part numbers across books -------------------------------------

def test_section_payload_lists_other_books_using_the_same_part(client, settings_20pct):
    """About 40% of the catalogue is shared, so each variant reports where else
    the same part number is printed."""
    from parts.tests.factories import (
        PartFactory, PartSectionFactory, PartsModelFactory, SectionPartFactory,
    )

    shared = PartFactory(part_number="90145-M9Q-000")
    only_here = PartFactory(part_number="64310-HHA-000-KA")

    mine = PartsModelFactory(name="HD200 evo", model_code="LH18W7-8", slug="hd200-evo")
    other = PartsModelFactory(name="HD200", model_code="LH18W-8", slug="hd200")
    retired = PartsModelFactory(name="Old", model_code="ZZ99W-8", slug="old", is_active=False)

    section = PartSectionFactory(parts_model=mine, code="F08")
    SectionPartFactory(section=section, part=shared, ref_number="1")
    SectionPartFactory(section=section, part=only_here, ref_number="2")
    SectionPartFactory(section=PartSectionFactory(parts_model=other, code="F08"), part=shared)
    SectionPartFactory(section=PartSectionFactory(parts_model=retired, code="F08"), part=shared)

    response = client.get(f"/api/parts/models/{mine.slug}/sections/F08/")

    assert response.status_code == 200
    by_ref = {c["ref_number"]: c["variants"][0] for c in response.json()["callouts"]}
    assert [m["model_code"] for m in by_ref["1"]["shared_models"]] == ["LH18W-8"]
    # The book being viewed is never listed against its own parts, and an
    # inactive book is not something a customer can browse to.
    assert "LH18W7-8" not in str(by_ref["1"]["shared_models"])
    assert "ZZ99W-8" not in str(by_ref["1"]["shared_models"])
    assert by_ref["2"]["shared_models"] == []
