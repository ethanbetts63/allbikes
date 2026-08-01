from datetime import timedelta
from decimal import Decimal

import pytest
from django.db import IntegrityError
from django.utils import timezone

from parts.models import (
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

    def test_fitment_key_is_stable_natural_identity(self):
        section = PartSectionFactory(code='F05')
        part = PartFactory(part_number='53205-ALA-000-RD')
        fitment = SectionPartFactory(section=section, part=part, ref_number='6')
        assert fitment.fitment_key == (
            f'{section.parts_model.model_code}:F05:6:53205-ALA-000-RD:original'
        )


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
        s.markup_percentage = Decimal('15.5')
        assert s.apply_markup(Decimal('10.01')) == Decimal('11.56')


def _bare_order(**over):
    """A saved PartsOrder with the minimum required fields."""
    base = {
        'customer_name': 'Jane Smith', 'customer_email': 'jane@example.com',
        'address_line1': '1 St', 'suburb': 'Perth', 'state': 'WA', 'postcode': '6000',
        'backorder_hold_days': PartsSettings.get().backorder_hold_days,
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

    def test_uses_order_policy_snapshot_when_hold_days_not_supplied(self):
        order = _bare_order(backorder_hold_days=9)
        settings = PartsSettings.get()
        settings.backorder_hold_days = 30
        settings.save()
        assert order.backorder_days_remaining() == 9
