from decimal import Decimal
from unittest.mock import MagicMock

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from parts.checkout import create_parts_order
from parts.models import PartsSettings
from parts.tests.factories import PartFactory, PartSectionFactory, SectionPartFactory

pytestmark = pytest.mark.django_db


@pytest.fixture
def admin_client():
    user = get_user_model().objects.create_user(username='admin', password='x', is_staff=True)
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture(autouse=True)
def settings_fixture():
    s = PartsSettings.get()
    s.markup_percentage = Decimal('20')
    s.domestic_shipping_fee = Decimal('15')
    s.save()
    return s


def _customer(**over):
    base = {
        'customer_name': 'Jane Smith', 'customer_email': 'jane@example.com', 'customer_phone': '',
        'address_line1': '1 St', 'suburb': 'Perth', 'state': 'WA', 'postcode': '6000',
        'country': 'Australia', 'terms_accepted': True,
    }
    base.update(over)
    return base


def _order(available=5, qty=1, part_number='A-1'):
    p = PartFactory(part_number=part_number, wholesale_price_incl_gst=Decimal('100'),
                    available_qty=available, in_pa_feed=True)
    SectionPartFactory(section=PartSectionFactory(), ref_number='1', part=p)
    return create_parts_order(customer=_customer(), items=[{'part_number': part_number, 'quantity': qty}])


class TestAdminList:
    def test_requires_admin(self):
        _order()
        assert APIClient().get('/api/parts/admin/orders/').status_code in (401, 403)

    def test_lists_orders(self, admin_client):
        _order()
        data = admin_client.get('/api/parts/admin/orders/').json()
        assert data['count'] == 1
        assert data['results'][0]['item_count'] == 1

    def test_search_by_reference(self, admin_client):
        order = _order()
        data = admin_client.get(f'/api/parts/admin/orders/?q={order.order_reference}').json()
        assert data['count'] == 1

    def test_filter_has_backorder(self, admin_client):
        _order(available=5, qty=1, part_number='INSTOCK')
        _order(available=0, qty=2, part_number='OOS')
        data = admin_client.get('/api/parts/admin/orders/?has_backorder=true').json()
        assert data['count'] == 1


class TestAdminDetailAndUpdate:
    def test_detail_includes_items_and_intent(self, admin_client):
        order = _order()
        from payments.models import Payment
        Payment.objects.create(parts_order=order, stripe_payment_intent_id='pi_abc', amount=order.total, status='succeeded')
        data = admin_client.get(f'/api/parts/admin/orders/{order.id}/').json()
        assert len(data['items']) == 1
        assert data['stripe_payment_intent_id'] == 'pi_abc'

    def test_update_status_and_notes(self, admin_client):
        order = _order()
        resp = admin_client.patch(f'/api/parts/admin/orders/{order.id}/',
                                  {'status': 'dispatched', 'admin_notes': 'called SP'}, format='json')
        assert resp.status_code == 200
        assert resp.json()['status'] == 'dispatched'
        assert resp.json()['admin_notes'] == 'called SP'


class TestAdminPartsSettings:
    def test_requires_admin(self):
        assert APIClient().get('/api/parts/admin/settings/').status_code in (401, 403)

    def test_reads_and_updates_settings(self, admin_client):
        response = admin_client.get('/api/parts/admin/settings/')
        assert response.status_code == 200
        assert response.json()['markup_percentage'] == '20.00'

        response = admin_client.patch(
            '/api/parts/admin/settings/',
            {
                'markup_percentage': '25.00', 'domestic_shipping_fee': '19.50',
                'international_shipping_fee': '65.00', 'enable_new_part_sales': False,
            },
            format='json',
        )
        assert response.status_code == 200
        assert response.json()['markup_percentage'] == '25.00'
        assert response.json()['domestic_shipping_fee'] == '19.50'
        assert response.json()['enable_new_part_sales'] is False

    def test_rejects_negative_amounts(self, admin_client):
        response = admin_client.patch('/api/parts/admin/settings/', {'domestic_shipping_fee': '-1.00'}, format='json')
        assert response.status_code == 400


class TestSupplierEmail:
    def test_draft_uses_supplier_prices_and_keeps_recipient_blank(self, admin_client):
        order = _order()
        order.status = 'paid'
        order.save()
        response = admin_client.get(f'/api/parts/admin/orders/{order.id}/supplier-email/')
        assert response.status_code == 200
        data = response.json()
        assert data['to'] == ''
        assert data['items'][0]['unit_price'] == 100.0
        assert data['supplier_parts_total'] == 100.0
        assert data['items'][0]['customer_unit_price'] == 120.0
        assert data['items'][0]['gross_profit'] == 20.0
        assert data['gross_profit_total'] == 20.0
        assert '1. A-1' in data['body']
        item = order.items.first()
        assert f'Model: {item.model_name} ({item.model_code})' in data['body']
        assert f'Section: {item.section_code} · Ref {item.ref_number}' in data['body']
        assert 'Quantity: 1 × $100.00 = $100.00' in data['body']
        assert 'do not ship any part of the order' in data['body']
        assert order.customer_name in data['body']

    def test_send_requires_recipient_and_does_not_change_order_status(self, admin_client, monkeypatch):
        order = _order()
        order.status = 'paid'
        order.save()
        send = MagicMock(return_value=True)
        monkeypatch.setattr('parts.views.admin_order_views.send_parts_supplier_dispatch', send)

        missing = admin_client.post(f'/api/parts/admin/orders/{order.id}/supplier-email/', {}, format='json')
        assert missing.status_code == 400

        response = admin_client.post(
            f'/api/parts/admin/orders/{order.id}/supplier-email/',
            {'to': 'parts@supplier.test', 'subject': 'Order', 'body': 'Hello'}, format='json',
        )
        assert response.status_code == 200
        send.assert_called_once_with(order, to='parts@supplier.test', subject='Order', text_body='Hello')
        order.refresh_from_db()
        assert order.status == 'paid'


class TestAdminItemActions:
    def test_place_and_remove_backorder(self, admin_client):
        order = _order(available=5)
        item_id = order.items.first().id
        r = admin_client.patch(f'/api/parts/admin/items/{item_id}/', {'action': 'place_backorder'}, format='json')
        item = next(i for i in r.json()['items'] if i['id'] == item_id)
        assert item['backordered'] is True and item['backorder_since'] is not None
        assert item['backorder_days_remaining'] == 14
        assert r.json()['has_backorder'] is True

        r2 = admin_client.patch(f'/api/parts/admin/items/{item_id}/', {'action': 'remove_backorder'}, format='json')
        assert r2.json()['has_backorder'] is False

    def test_mark_refunded_rolls_up(self, admin_client):
        order = _order()
        order.status = 'paid'
        order.save()
        item_id = order.items.first().id
        r = admin_client.patch(f'/api/parts/admin/items/{item_id}/', {'action': 'mark_refunded'}, format='json')
        # single-line order fully refunded -> order refunded
        assert r.json()['status'] == 'refunded'

    def test_partial_refund_rollup(self, admin_client):
        # two lines, refund one -> partially_refunded
        p2 = PartFactory(part_number='B-2', wholesale_price_incl_gst=Decimal('50'), available_qty=5, in_pa_feed=True)
        SectionPartFactory(section=PartSectionFactory(), ref_number='2', part=p2)
        order = _order()
        from parts.models import PartsOrderItem, Part
        # add a second line manually
        order.items.create(part_number='B-2', description='x', quantity=1, unit_price=Decimal('60'), line_total=Decimal('60'))
        order.status = 'paid'
        order.save()
        first = order.items.first()
        r = admin_client.patch(f'/api/parts/admin/items/{first.id}/', {'action': 'mark_refunded'}, format='json')
        assert r.json()['status'] == 'partially_refunded'

    def test_invalid_action(self, admin_client):
        order = _order()
        item_id = order.items.first().id
        r = admin_client.patch(f'/api/parts/admin/items/{item_id}/', {'action': 'nope'}, format='json')
        assert r.status_code == 400
