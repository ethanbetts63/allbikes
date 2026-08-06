from decimal import Decimal
from unittest.mock import MagicMock

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from parts.checkout import create_parts_order
from parts.models import PartsSettings
from parts.tests.factories import PartFactory, PartSectionFactory, SectionPartFactory
from payments.models import Payment

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
    s.shipping_fee = Decimal('15')
    s.backorder_hold_days = 14
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
    fitment = SectionPartFactory(section=PartSectionFactory(), ref_number='1', part=p)
    return create_parts_order(customer=_customer(), items=[{
        'part_number': part_number, 'fitment_key': fitment.fitment_key, 'quantity': qty,
    }])


def _mark_paid(order):
    Payment.objects.create(
        parts_order=order,
        stripe_payment_intent_id=f'pi_{order.order_reference}',
        amount=order.total,
        status='succeeded',
    )
    order.status = 'paid'
    order.amount_paid = order.total
    order.save(update_fields=['status', 'amount_paid', 'updated_at'])
    return order


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
        data = admin_client.get(f'/api/parts/admin/orders/{order.order_reference}/').json()
        assert len(data['items']) == 1
        assert data['stripe_payment_intent_id'] == 'pi_abc'

    def test_detail_messages_match_the_shared_message_table_shape(self, admin_client):
        from django.utils import timezone
        from notifications.models import Message

        order = _order()
        Message.objects.create(
            content_object=order,
            message_type='parts_customer_confirmation',
            channel='email',
            to='jane@example.com',
            subject='Your parts order',
            status='delivered',
            sent_at=timezone.now(),
        )

        data = admin_client.get(f'/api/parts/admin/orders/{order.order_reference}/').json()
        assert data['messages'][0]['channel'] == 'email'
        assert data['messages'][0]['status'] == 'delivered'

    def test_detail_uses_snapshotted_cost_and_shows_profit_ex_gst(self, admin_client):
        order = _order()
        item = order.items.get()
        # Later feed/settings changes must not rewrite this order's economics.
        from parts.models import Part
        Part.objects.filter(part_number=item.part_number).update(
            wholesale_price_incl_gst=Decimal('999.00')
        )
        settings = PartsSettings.get()
        settings.markup_percentage = Decimal('50.00')
        settings.save()

        data = admin_client.get(f'/api/parts/admin/orders/{order.order_reference}/').json()
        line = data['items'][0]
        assert line['rrp_unit_price_incl_gst'] == '100.00'
        assert line['supplier_discount_percentage'] == '30.00'
        assert line['supplier_unit_cost_incl_gst'] == '70.00'
        assert line['markup_percentage'] == '20.00'
        assert line['unit_price'] == '120.00'
        assert line['gross_profit_ex_gst'] == '45.45'
        assert line['profit_margin_percentage'] == '41.67'
        assert data['margin']['gross_profit_ex_gst_total'] == 45.45
        assert data['margin']['profit_margin_percentage'] == 41.67

    def test_detail_exposes_order_level_backorder_window(self, admin_client):
        order = _order()
        data = admin_client.get(f'/api/parts/admin/orders/{order.order_reference}/').json()
        assert data['backorder_hold_days'] == 14
        assert data['backorder_days_remaining'] == 14
        assert data['backorder_window_expired'] is False
        # the window is a property of the order, not of each line
        assert 'backorder_days_remaining' not in data['items'][0]
        assert 'backorder_since' not in data['items'][0]
        assert 'backorder_overdue' not in data['items'][0]

    def test_detail_reports_an_expired_window_for_an_old_order(self, admin_client):
        from datetime import timedelta

        from django.utils import timezone

        from parts.models import PartsOrder

        order = _order()
        PartsOrder.objects.filter(pk=order.pk).update(
            created_at=timezone.now() - timedelta(days=20)
        )
        data = admin_client.get(f'/api/parts/admin/orders/{order.order_reference}/').json()
        assert data['backorder_days_remaining'] == -6
        assert data['backorder_window_expired'] is True

    def test_update_status_and_notes(self, admin_client):
        order = _order()
        resp = admin_client.patch(f'/api/parts/admin/orders/{order.order_reference}/',
                                  {'status': 'dispatched', 'admin_notes': 'called SP'}, format='json')
        assert resp.status_code == 200
        assert resp.json()['status'] == 'dispatched'
        assert resp.json()['admin_notes'] == 'called SP'

    @pytest.mark.parametrize('restricted_status', ['paid', 'refunded', 'partially_refunded'])
    def test_payment_statuses_require_a_payment_record(self, admin_client, restricted_status):
        order = _order()
        response = admin_client.patch(
            f'/api/parts/admin/orders/{order.order_reference}/',
            {'status': restricted_status},
            format='json',
        )
        assert response.status_code == 400
        assert 'payment record' in response.json()['status'][0].lower()
        order.refresh_from_db()
        assert order.status == 'pending_payment'

    @pytest.mark.parametrize('restricted_status', ['paid', 'refunded', 'partially_refunded'])
    def test_payment_record_allows_restricted_status(self, admin_client, restricted_status):
        order = _order()
        Payment.objects.create(
            parts_order=order,
            stripe_payment_intent_id=f'pi_{restricted_status}',
            amount=order.total,
            status='pending',
        )
        response = admin_client.patch(
            f'/api/parts/admin/orders/{order.order_reference}/',
            {'status': restricted_status},
            format='json',
        )
        assert response.status_code == 200
        assert response.json()['status'] == restricted_status


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
                'markup_percentage': '25.00', 'shipping_fee': '19.50',
                'enable_new_part_sales': False,
            },
            format='json',
        )
        assert response.status_code == 200
        assert response.json()['markup_percentage'] == '25.00'
        assert response.json()['shipping_fee'] == '19.50'
        assert response.json()['enable_new_part_sales'] is False

    def test_rejects_negative_amounts(self, admin_client):
        response = admin_client.patch('/api/parts/admin/settings/', {'shipping_fee': '-1.00'}, format='json')
        assert response.status_code == 400


class TestCustomerUpdate:
    """The three fixed customer emails and the guards on when they may be sent."""

    def _send(self, admin_client, order, update_type):
        return admin_client.post(
            f'/api/parts/admin/orders/{order.order_reference}/customer-update/',
            {'type': update_type}, format='json',
        )

    def test_arranged_blocked_while_a_line_is_on_backorder(self, admin_client):
        order = _mark_paid(_order())
        item = order.items.first()
        item.backordered = True
        item.save()
        r = self._send(admin_client, order, 'arranged')
        assert r.status_code == 400
        assert 'backorder' in r.json()['detail'].lower()

    def test_arranged_allowed_once_no_line_is_on_backorder(self, admin_client, monkeypatch):
        sent = {}
        monkeypatch.setattr(
            'parts.views.admin_order_views.send_parts_customer_update',
            lambda o, t, **kw: sent.update(type=t) or True,
        )
        order = _mark_paid(_order())
        r = self._send(admin_client, order, 'arranged')
        assert r.status_code == 200
        assert sent['type'] == 'arranged'

    def test_arranged_allowed_when_the_backordered_line_was_refunded(self, admin_client, monkeypatch):
        """Refunding clears `backordered`, so the order can then be arranged."""
        monkeypatch.setattr(
            'parts.views.admin_order_views.send_parts_customer_update',
            lambda o, t, **kw: True,
        )
        order = _mark_paid(_order())
        item = order.items.first()
        item.backordered = True
        item.save()
        admin_client.patch(f'/api/parts/admin/items/{item.id}/', {'action': 'mark_refunded'}, format='json')
        assert self._send(admin_client, order, 'arranged').status_code == 200

    def test_arranged_blocked_for_unpaid_order(self, admin_client):
        response = self._send(admin_client, _order(), 'arranged')
        assert response.status_code == 400
        assert 'paid orders' in response.json()['detail'].lower()


class TestCustomerUpdateTemplates:
    """The rendered bodies, since these are customer-facing and fixed copy."""

    def _render(self, order, update_type):
        from notifications.models import Message
        from notifications.utils.email import send_parts_customer_update

        assert send_parts_customer_update(order, update_type, backorder_days=14) is True
        message = Message.objects.order_by('-id').first()
        return message.body_text, message.body_html

    def test_all_three_use_the_shared_html_shell(self, admin_client, monkeypatch):
        monkeypatch.setattr('notifications.utils.email._send_mailgun', lambda *a, **kw: None)
        order = _order()
        for update_type in ('backorder', 'refund', 'arranged'):
            _, html = self._render(order, update_type)
            # Markers that only exist in notifications/emails/base.html
            assert '<!DOCTYPE html>' in html
            assert 'full-size-logo.png' in html
            assert 'scootershop.com.au' in html

    def test_refund_says_remaining_items_are_released(self, admin_client, monkeypatch):
        monkeypatch.setattr('notifications.utils.email._send_mailgun', lambda *a, **kw: None)
        p2 = PartFactory(part_number='B-2', wholesale_price_incl_gst=Decimal('50'), available_qty=5, in_pa_feed=True)
        SectionPartFactory(section=PartSectionFactory(), ref_number='2', part=p2)
        order = _order()
        order.items.create(part_number='B-2', description='x', quantity=1,
                           unit_price=Decimal('60'), line_total=Decimal('60'))
        first = order.items.first()
        first.status = 'refunded'
        first.save()

        text, html = self._render(order, 'refund')
        assert 'remaining non-refunded items in your order have now been released' in text
        assert 'remaining non-refunded items in your order have now been released' in html

    def test_refund_says_nothing_left_to_ship_when_all_lines_refunded(self, admin_client, monkeypatch):
        monkeypatch.setattr('notifications.utils.email._send_mailgun', lambda *a, **kw: None)
        order = _order()
        for item in order.items.all():
            item.status = 'refunded'
            item.save()

        text, html = self._render(order, 'refund')
        assert 'nothing further to ship' in text
        assert 'nothing further to ship' in html
        assert 'have now been released' not in text


class TestSupplierEmailTemplate:
    def test_uses_the_shared_shell_and_keeps_the_composed_body_verbatim(self, admin_client, monkeypatch):
        """The compose screen is the safety gate, so the HTML must not rewrite the body."""
        from notifications.models import Message
        from notifications.utils.email import send_parts_supplier_dispatch

        monkeypatch.setattr('notifications.utils.email._send_mailgun', lambda *a, **kw: None)
        order = _order()
        body = 'Please supply:\n  A-1 x2\n\nShip to: 1 St, Perth'
        assert send_parts_supplier_dispatch(order, to='supplier@example.com',
                                            subject='Parts order', text_body=body) is True

        message = Message.objects.order_by('-id').first()
        assert '<!DOCTYPE html>' in message.body_html
        assert 'full-size-logo.png' in message.body_html
        assert order.order_reference in message.body_html
        # Operator copy is preserved exactly, newlines and all.
        assert message.body_text == body
        assert 'Please supply:\n  A-1 x2\n\nShip to: 1 St, Perth' in message.body_html

    def test_composed_body_is_escaped_not_injected(self, admin_client, monkeypatch):
        from notifications.models import Message
        from notifications.utils.email import send_parts_supplier_dispatch

        monkeypatch.setattr('notifications.utils.email._send_mailgun', lambda *a, **kw: None)
        order = _order()
        send_parts_supplier_dispatch(order, to='supplier@example.com', subject='x',
                                     text_body='<script>alert(1)</script>')
        message = Message.objects.order_by('-id').first()
        assert '<script>alert(1)</script>' not in message.body_html
        assert '&lt;script&gt;' in message.body_html


class TestSupplierEmail:
    def test_draft_uses_supplier_prices_and_keeps_recipient_blank(self, admin_client):
        order = _order()
        order.status = 'paid'
        order.save()
        response = admin_client.get(f'/api/parts/admin/orders/{order.order_reference}/supplier-email/')
        assert response.status_code == 200
        data = response.json()
        assert data['to'] == ''
        assert data['items'][0]['unit_price'] == 70.0
        assert data['supplier_parts_total_incl_gst'] == 70.0
        assert data['items'][0]['customer_unit_price'] == 120.0
        assert data['items'][0]['gross_profit_ex_gst'] == 45.45
        assert data['gross_profit_ex_gst_total'] == 45.45
        assert data['profit_margin_percentage'] == 41.67
        assert '1. A-1' in data['body']
        item = order.items.first()
        assert f'Model: {item.model_name} ({item.model_code})' in data['body']
        assert f'Section: {item.section_code} · Ref {item.ref_number}' in data['body']
        assert 'Quantity: 1 × $70.00 = $70.00' in data['body']
        assert 'do not ship any part of the order' in data['body']
        assert order.customer_name in data['body']

    def test_send_requires_recipient_and_does_not_change_order_status(self, admin_client, monkeypatch):
        order = _order()
        order.status = 'paid'
        order.save()
        send = MagicMock(return_value=True)
        monkeypatch.setattr('parts.views.admin_order_views.send_parts_supplier_dispatch', send)

        missing = admin_client.post(f'/api/parts/admin/orders/{order.order_reference}/supplier-email/', {}, format='json')
        assert missing.status_code == 400

        response = admin_client.post(
            f'/api/parts/admin/orders/{order.order_reference}/supplier-email/',
            {'to': 'parts@supplier.test', 'subject': 'Order', 'body': 'Hello'}, format='json',
        )
        assert response.status_code == 200
        send.assert_called_once_with(order, to='parts@supplier.test', subject='Order', text_body='Hello')
        order.refresh_from_db()
        assert order.status == 'paid'


class TestDerivedItemCompletion:
    def test_lines_read_to_order_while_the_order_is_open(self, admin_client):
        order = _order()
        order.status = 'paid'
        order.save()
        data = admin_client.get(f'/api/parts/admin/orders/{order.order_reference}/').json()
        assert data['items'][0]['status'] == 'to_order'

    def test_completing_the_order_completes_every_unrefunded_line(self, admin_client):
        order = _order()
        order.items.create(part_number='B-2', description='x', quantity=1,
                           unit_price=Decimal('60'), line_total=Decimal('60'))
        order.status = 'completed'
        order.save()
        data = admin_client.get(f'/api/parts/admin/orders/{order.order_reference}/').json()
        assert [i['status'] for i in data['items']] == ['completed', 'completed']

    def test_a_refunded_line_stays_refunded_on_a_completed_order(self, admin_client):
        order = _order()
        item = order.items.first()
        item.status = 'refunded'
        item.save()
        order.status = 'completed'
        order.save()
        data = admin_client.get(f'/api/parts/admin/orders/{order.order_reference}/').json()
        assert data['items'][0]['status'] == 'refunded'

    def test_completion_is_not_stored_on_the_row(self, admin_client):
        """The DB keeps to_order; only the wire value changes."""
        from parts.models import PartsOrderItem

        order = _order()
        order.status = 'completed'
        order.save()
        admin_client.get(f'/api/parts/admin/orders/{order.order_reference}/')
        assert PartsOrderItem.objects.get(pk=order.items.first().pk).status == 'to_order'


class TestAdminItemActions:
    def test_place_and_remove_backorder(self, admin_client):
        order = _order(available=5)
        item_id = order.items.first().id
        r = admin_client.patch(f'/api/parts/admin/items/{item_id}/', {'action': 'place_backorder'}, format='json')
        item = next(i for i in r.json()['items'] if i['id'] == item_id)
        assert item['backordered'] is True
        assert r.json()['has_backorder'] is True
        assert r.json()['backorder_days_remaining'] == 14

        r2 = admin_client.patch(f'/api/parts/admin/items/{item_id}/', {'action': 'remove_backorder'}, format='json')
        assert r2.json()['has_backorder'] is False

    def test_mark_refunded_rolls_up(self, admin_client):
        order = _mark_paid(_order())
        item_id = order.items.first().id
        r = admin_client.patch(f'/api/parts/admin/items/{item_id}/', {'action': 'mark_refunded'}, format='json')
        # single-line order fully refunded -> order refunded
        assert r.json()['status'] == 'refunded'

    def test_partial_refund_rollup(self, admin_client):
        # two lines, refund one -> partially_refunded
        p2 = PartFactory(part_number='B-2', wholesale_price_incl_gst=Decimal('50'), available_qty=5, in_pa_feed=True)
        SectionPartFactory(section=PartSectionFactory(), ref_number='2', part=p2)
        order = _mark_paid(_order())
        from parts.models import PartsOrderItem, Part
        # add a second line manually
        order.items.create(part_number='B-2', description='x', quantity=1, unit_price=Decimal('60'), line_total=Decimal('60'))
        first = order.items.first()
        r = admin_client.patch(f'/api/parts/admin/items/{first.id}/', {'action': 'mark_refunded'}, format='json')
        assert r.json()['status'] == 'partially_refunded'

    def test_invalid_action(self, admin_client):
        order = _order()
        item_id = order.items.first().id
        r = admin_client.patch(f'/api/parts/admin/items/{item_id}/', {'action': 'nope'}, format='json')
        assert r.status_code == 400

    def test_mark_fulfilled_is_no_longer_an_action(self, admin_client):
        order = _order()
        item_id = order.items.first().id
        r = admin_client.patch(f'/api/parts/admin/items/{item_id}/', {'action': 'mark_fulfilled'}, format='json')
        assert r.status_code == 400

    def test_mark_to_order_undoes_a_refund(self, admin_client):
        order = _mark_paid(_order())
        item_id = order.items.first().id
        admin_client.patch(f'/api/parts/admin/items/{item_id}/', {'action': 'mark_refunded'}, format='json')
        r = admin_client.patch(f'/api/parts/admin/items/{item_id}/', {'action': 'mark_to_order'}, format='json')
        item = next(i for i in r.json()['items'] if i['id'] == item_id)
        assert item['status'] == 'to_order'

    def test_mark_refunded_requires_a_payment_record(self, admin_client):
        order = _order()
        item = order.items.first()
        response = admin_client.patch(
            f'/api/parts/admin/items/{item.id}/',
            {'action': 'mark_refunded'},
            format='json',
        )
        assert response.status_code == 400
        assert 'payment record' in response.json()['detail'].lower()
        item.refresh_from_db()
        order.refresh_from_db()
        assert item.status == 'to_order'
        assert order.status == 'pending_payment'

    def test_place_backorder_blocked_once_the_window_has_closed(self, admin_client):
        from datetime import timedelta

        from django.utils import timezone

        from parts.models import PartsOrder, PartsOrderItem

        order = _order()
        PartsOrder.objects.filter(pk=order.pk).update(
            created_at=timezone.now() - timedelta(days=20)
        )
        item_id = order.items.first().id
        r = admin_client.patch(f'/api/parts/admin/items/{item_id}/', {'action': 'place_backorder'}, format='json')
        assert r.status_code == 400
        assert 'backorder window' in r.json()['detail'].lower()
        assert PartsOrderItem.objects.get(pk=item_id).backordered is False

    def test_place_backorder_blocked_exactly_on_the_boundary(self, admin_client):
        from datetime import timedelta

        from django.utils import timezone

        from parts.models import PartsOrder

        order = _order()
        PartsOrder.objects.filter(pk=order.pk).update(
            created_at=timezone.now() - timedelta(days=14)
        )
        item_id = order.items.first().id
        r = admin_client.patch(f'/api/parts/admin/items/{item_id}/', {'action': 'place_backorder'}, format='json')
        assert r.status_code == 400

    def test_remove_backorder_still_allowed_after_the_window_closes(self, admin_client):
        """An operator must always be able to clear a stale flag."""
        from datetime import timedelta

        from django.utils import timezone

        from parts.models import PartsOrder

        order = _order()
        item = order.items.first()
        item.backordered = True
        item.save()
        PartsOrder.objects.filter(pk=order.pk).update(
            created_at=timezone.now() - timedelta(days=20)
        )
        r = admin_client.patch(f'/api/parts/admin/items/{item.id}/', {'action': 'remove_backorder'}, format='json')
        assert r.status_code == 200
        assert r.json()['has_backorder'] is False
