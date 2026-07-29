from datetime import timedelta
from decimal import Decimal

import pytest
from django.db import IntegrityError
from django.utils import timezone

from parts.models import (
    Part,
    PartsModel,
    PartsOrder,
    PartsOrderItem,
    PartsSettings,
    SectionPart,
)
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

    def test_current_shipping_fee(self):
        s = PartsSettings.get()
        s.shipping_fee = Decimal('15')
        assert s.current_shipping_fee() == Decimal('15')


def _bare_order(**over):
    """A saved PartsOrder with the minimum required fields."""
    base = {
        'customer_name': 'Jane Smith', 'customer_email': 'jane@example.com',
        'address_line1': '1 St', 'suburb': 'Perth', 'state': 'WA', 'postcode': '6000',
    }
    base.update(over)
    return PartsOrder.objects.create(**base)


def _age_order(order, days):
    """created_at is auto_now_add, so it can only be moved with a queryset update."""
    PartsOrder.objects.filter(pk=order.pk).update(
        created_at=timezone.now() - timedelta(days=days)
    )
    order.refresh_from_db()
    return order


class TestPartsOrderItemStatus:
    def test_defaults_to_to_order(self):
        order = _bare_order()
        item = order.items.create(
            part_number='A-1', quantity=1, unit_price=Decimal('10'), line_total=Decimal('10')
        )
        assert item.status == 'to_order'

    def test_status_choices_are_to_order_and_refunded(self):
        assert PartsOrderItem.STATUS_CHOICES == [
            ('to_order', 'To Order'),
            ('refunded', 'Refunded'),
        ]

    def test_backorder_since_field_is_gone(self):
        names = {f.name for f in PartsOrderItem._meta.get_fields()}
        assert 'backorder_since' not in names


class TestPartsOrderCompletedStatus:
    def test_completed_is_a_valid_order_status(self):
        assert ('completed', 'Completed') in PartsOrder.STATUS_CHOICES


class TestBackorderWindow:
    def test_full_window_on_the_day_the_order_is_placed(self):
        order = _bare_order()
        assert order.backorder_days_remaining(hold_days=14) == 14
        assert order.backorder_window_expired(hold_days=14) is False

    def test_clock_counts_from_the_order_date(self):
        order = _age_order(_bare_order(), days=5)
        assert order.backorder_days_remaining(hold_days=14) == 9
        assert order.backorder_window_expired(hold_days=14) is False

    def test_window_expired_exactly_on_the_boundary(self):
        order = _age_order(_bare_order(), days=14)
        assert order.backorder_days_remaining(hold_days=14) == 0
        assert order.backorder_window_expired(hold_days=14) is True

    def test_window_expired_past_the_boundary(self):
        order = _age_order(_bare_order(), days=20)
        assert order.backorder_days_remaining(hold_days=14) == -6
        assert order.backorder_window_expired(hold_days=14) is True

    def test_falls_back_to_settings_when_hold_days_not_supplied(self):
        s = PartsSettings.get()
        s.backorder_hold_days = 7
        s.save()
        assert _bare_order().backorder_days_remaining() == 7
