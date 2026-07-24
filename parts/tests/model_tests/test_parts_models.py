from decimal import Decimal

import pytest
from django.db import IntegrityError

from parts.models import Part, PartsModel, PartsSettings, SectionPart
from parts.tests.factories import (
    PartFactory,
    PartSectionFactory,
    PartsModelFactory,
    SectionPartFactory,
)

pytestmark = pytest.mark.django_db


class TestPartsModel:
    def test_str(self):
        m = PartsModelFactory(name="Classic 150", model_code="AX15W2-6")
        assert str(m) == "Classic 150 (AX15W2-6)"

    def test_model_code_unique(self):
        PartsModelFactory(model_code="DUP-1")
        with pytest.raises(IntegrityError):
            PartsModelFactory(model_code="DUP-1")


class TestPartSection:
    def test_code_unique_per_model(self):
        m = PartsModelFactory()
        PartSectionFactory(parts_model=m, code="E01")
        with pytest.raises(IntegrityError):
            PartSectionFactory(parts_model=m, code="E01")

    def test_same_code_allowed_across_models(self):
        PartSectionFactory(parts_model=PartsModelFactory(), code="E01")
        # different model, same code — should not raise
        PartSectionFactory(parts_model=PartsModelFactory(), code="E01")


class TestPart:
    def test_is_orderable_requires_feed_and_price(self):
        assert PartFactory(in_pa_feed=True, wholesale_price_incl_gst=Decimal('10')).is_orderable
        assert not PartFactory(in_pa_feed=False, wholesale_price_incl_gst=Decimal('10')).is_orderable
        assert not PartFactory(in_pa_feed=True, wholesale_price_incl_gst=None).is_orderable

    def test_customer_price_applies_markup(self):
        p = PartFactory(wholesale_price_incl_gst=Decimal('100.00'))
        assert p.customer_price(Decimal('20')) == Decimal('120.00')

    def test_customer_price_rounds_half_up(self):
        p = PartFactory(wholesale_price_incl_gst=Decimal('10.01'))
        # 10.01 * 1.155 = 11.56155 -> 11.56
        assert p.customer_price(Decimal('15.5')) == Decimal('11.56')

    def test_customer_price_none_when_unpriced(self):
        assert PartFactory(wholesale_price_incl_gst=None).customer_price(Decimal('20')) is None


class TestSectionPart:
    def test_multiple_variants_share_ref_number(self):
        section = PartSectionFactory()
        SectionPartFactory(section=section, ref_number="6", part=PartFactory(part_number="53205-ALA-000-RD"))
        SectionPartFactory(section=section, ref_number="6", part=PartFactory(part_number="53205-ALA-000-KG"))
        assert SectionPart.objects.filter(section=section, ref_number="6").count() == 2

    def test_part_is_protected_from_delete(self):
        sp = SectionPartFactory()
        with pytest.raises(Exception):
            sp.part.delete()


class TestPartsSettings:
    def test_get_is_singleton(self):
        a = PartsSettings.get()
        b = PartsSettings.get()
        assert a.pk == b.pk == 1
        assert PartsSettings.objects.count() == 1

    def test_save_forces_single_row(self):
        PartsSettings.get()
        second = PartsSettings(markup_percentage=Decimal('30'))
        second.save()
        assert PartsSettings.objects.count() == 1
        assert PartsSettings.get().markup_percentage == Decimal('30')

    def test_apply_markup(self):
        s = PartsSettings.get()
        s.markup_percentage = Decimal('25')
        assert s.apply_markup(Decimal('80.00')) == Decimal('100.00')
        assert s.apply_markup(None) is None

    def test_shipping_fee_by_destination(self):
        s = PartsSettings.get()
        s.domestic_shipping_fee = Decimal('15')
        s.international_shipping_fee = Decimal('60')
        assert s.shipping_fee(is_international=False) == Decimal('15')
        assert s.shipping_fee(is_international=True) == Decimal('60')
