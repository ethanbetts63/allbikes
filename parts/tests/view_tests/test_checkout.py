from decimal import Decimal
from unittest.mock import MagicMock, patch

import pytest
from rest_framework.test import APIClient

from parts.checkout import CheckoutError, create_parts_order
from parts.models import Part, PartsOrder, PartsSettings, SectionPart
from parts.serializers.order_serializers import PartsCheckoutSerializer
from parts.tests.factories import PartFactory, PartSectionFactory, SectionPartFactory
from payments.models import Payment

pytestmark = pytest.mark.django_db


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def settings_fixture():
    s = PartsSettings.get()
    s.markup_percentage = Decimal('20')
    s.shipping_fee = Decimal('15')
    s.save()
    return s


def _customer(**over):
    base = {
        'customer_name': 'Jane Smith',
        'customer_email': 'jane@example.com',
        'customer_phone': '0400000000',
        'address_line1': '1 Test St',
        'suburb': 'Dianella',
        'state': 'WA',
        'postcode': '6059',
        'country': 'Australia',
        'terms_accepted': True,
    }
    base.update(over)
    return base


def _item(part_number, quantity=1):
    fitment = SectionPart.objects.filter(part__part_number=part_number).first()
    return {
        'part_number': part_number,
        'fitment_key': fitment.fitment_key if fitment else 'missing-fitment',
        'quantity': quantity,
    }


def _checkout_payload(**customer_overrides):
    return {
        **_customer(**customer_overrides),
        'items': [{'part_number': 'A-1', 'fitment_key': 'model:section:1:A-1:original'}],
    }


class TestAustralianAddressValidation:
    @pytest.mark.parametrize('state,postcode', [
        ('ACT', '2600'),
        ('NSW', '2000'),
        ('NT', '0800'),
        ('QLD', '4000'),
        ('SA', '5000'),
        ('TAS', '7000'),
        ('VIC', '3000'),
        ('WA', '6000'),
    ])
    def test_accepts_compatible_state_and_postcode(self, state, postcode):
        serializer = PartsCheckoutSerializer(data=_checkout_payload(state=state, postcode=postcode))
        assert serializer.is_valid(), serializer.errors

    @pytest.mark.parametrize('postcode', ['605', '06059', '60A9', ''])
    def test_rejects_non_four_digit_postcode(self, postcode):
        serializer = PartsCheckoutSerializer(data=_checkout_payload(postcode=postcode))
        assert not serializer.is_valid()
        assert 'postcode' in serializer.errors

    def test_rejects_missing_state(self):
        payload = _checkout_payload()
        del payload['state']
        serializer = PartsCheckoutSerializer(data=payload)
        assert not serializer.is_valid()
        assert 'state' in serializer.errors

    def test_rejects_unknown_state(self):
        serializer = PartsCheckoutSerializer(data=_checkout_payload(state='XX'))
        assert not serializer.is_valid()
        assert 'state' in serializer.errors

    def test_rejects_postcode_from_another_state(self):
        serializer = PartsCheckoutSerializer(data=_checkout_payload(state='WA', postcode='2000'))
        assert not serializer.is_valid()
        assert serializer.errors['postcode'][0] == 'Postcode 2000 does not match WA.'


class TestCreatePartsOrderService:
    def test_sales_disabled_blocks_checkout(self, settings_fixture):
        p = PartFactory(part_number='DISABLED-1', wholesale_price_incl_gst=Decimal('10'), in_pa_feed=True)
        section_part = SectionPartFactory(section=PartSectionFactory(), part=p)
        settings = PartsSettings.get()
        settings.enable_new_part_sales = False
        settings.save()

        with pytest.raises(CheckoutError, match='temporarily unavailable'):
            create_parts_order(customer=_customer(), items=[{
                'part_number': p.part_number, 'section_part_id': section_part.id, 'quantity': 1,
            }])
    def test_totals_with_markup_and_shipping(self, settings_fixture):
        p = PartFactory(part_number='A-1', wholesale_price_incl_gst=Decimal('100'), available_qty=5, in_pa_feed=True)
        SectionPartFactory(section=PartSectionFactory(), ref_number='1', part=p)
        order = create_parts_order(customer=_customer(), items=[_item('A-1', 2)])
        assert order.subtotal == Decimal('240.00')   # 100*1.2 * 2
        assert order.shipping == Decimal('15.00')
        assert order.total == Decimal('255.00')
        assert order.items.count() == 1
        assert order.order_reference.startswith('SP-')
        item = order.items.get()
        assert item.rrp_unit_price_incl_gst == Decimal('100.00')
        assert item.supplier_discount_percentage == Decimal('30.00')
        assert item.supplier_unit_cost_incl_gst == Decimal('70.00')
        assert item.markup_percentage == Decimal('20.00')
        assert item.unit_price == Decimal('120.00')

    def test_supplier_discount_comes_from_config(self, settings_fixture, settings):
        settings.PARTS_SUPPLIER_DISCOUNT_PERCENTAGE = '25.00'
        part = PartFactory(
            part_number='A-1', wholesale_price_incl_gst=Decimal('100'),
            available_qty=5, in_pa_feed=True,
        )
        SectionPartFactory(section=PartSectionFactory(), ref_number='1', part=part)

        order = create_parts_order(customer=_customer(), items=[_item('A-1')])

        item = order.items.get()
        assert item.supplier_discount_percentage == Decimal('25.00')
        assert item.supplier_unit_cost_incl_gst == Decimal('75.00')

    def test_checkout_is_australia_only(self, settings_fixture):
        """A non-Australian country is ignored — we only ship domestically."""
        p = PartFactory(part_number='A-1', wholesale_price_incl_gst=Decimal('10'), available_qty=5, in_pa_feed=True)
        SectionPartFactory(section=PartSectionFactory(), ref_number='1', part=p)
        order = create_parts_order(customer=_customer(country='New Zealand'), items=[_item('A-1')])
        assert order.country == 'Australia'
        assert order.shipping == Decimal('15.00')

    def test_backorder_flag(self, settings_fixture):
        p = PartFactory(part_number='A-1', wholesale_price_incl_gst=Decimal('10'), available_qty=0, in_pa_feed=True)
        SectionPartFactory(section=PartSectionFactory(), ref_number='1', part=p)
        order = create_parts_order(customer=_customer(), items=[_item('A-1', 3)])
        assert order.has_backorder is True
        assert order.items.first().backordered is True

    def test_unavailable_raises(self, settings_fixture):
        PartFactory(part_number='A-1', in_pa_feed=False, wholesale_price_incl_gst=None)
        with pytest.raises(CheckoutError) as exc:
            create_parts_order(customer=_customer(), items=[_item('A-1')])
        assert 'A-1' in exc.value.unavailable

    def test_price_recomputed_from_catalog(self, settings_fixture):
        # even if client sent a price, server uses catalog wholesale * markup
        p = PartFactory(part_number='A-1', wholesale_price_incl_gst=Decimal('50'), available_qty=5, in_pa_feed=True)
        SectionPartFactory(section=PartSectionFactory(), ref_number='1', part=p)
        line = _item('A-1')
        line['unit_price'] = '1.00'
        order = create_parts_order(customer=_customer(), items=[line])
        assert order.items.first().unit_price == Decimal('60.00')


class TestCheckoutViews:
    def test_create_order_endpoint(self, client, settings_fixture):
        p = PartFactory(part_number='A-1', wholesale_price_incl_gst=Decimal('100'), available_qty=5, in_pa_feed=True)
        section_part = SectionPartFactory(section=PartSectionFactory(), ref_number='1', part=p)
        resp = client.post('/api/parts/orders/', {
            **_customer(), 'items': [{'part_number': 'A-1', 'section_part_id': section_part.id, 'quantity': 1}],
        }, format='json')
        assert resp.status_code == 201
        assert resp.json()['order_reference'].startswith('SP-')
        assert len(resp.json()['access_token']) >= 40

    def test_terms_required(self, client, settings_fixture):
        resp = client.post('/api/parts/orders/', {**_customer(terms_accepted=False), 'items': [{'part_number': 'X'}]}, format='json')
        assert resp.status_code == 400

    def test_unavailable_returns_409(self, client, settings_fixture):
        part = PartFactory(part_number='A-1', in_pa_feed=False, wholesale_price_incl_gst=None)
        section_part = SectionPartFactory(section=PartSectionFactory(), part=part)
        resp = client.post('/api/parts/orders/', {**_customer(), 'items': [{'part_number': 'A-1', 'section_part_id': section_part.id, 'quantity': 1}]}, format='json')
        assert resp.status_code == 409
        assert 'A-1' in resp.json()['unavailable']

    def test_retrieve_order(self, client, settings_fixture):
        p = PartFactory(part_number='A-1', wholesale_price_incl_gst=Decimal('10'), available_qty=5, in_pa_feed=True)
        SectionPartFactory(section=PartSectionFactory(), ref_number='1', part=p)
        order = create_parts_order(customer=_customer(), items=[_item('A-1')])
        resp = client.get(f'/api/parts/orders/{order.order_reference}/')
        assert resp.status_code in (401, 403)
        resp = client.get(f'/api/parts/orders/{order.order_reference}/confirmation/?token={order.access_token}')
        assert resp.status_code == 200
        assert resp.json()['order_reference'] == order.order_reference
        assert 'customer_email' not in resp.json()

    @patch('payments.payment_intents.stripe')
    def test_create_payment_intent(self, mock_stripe, client, settings_fixture):
        mock_stripe.PaymentIntent.create.return_value = MagicMock(id='pi_test', client_secret='cs_test')
        p = PartFactory(part_number='A-1', wholesale_price_incl_gst=Decimal('10'), available_qty=5, in_pa_feed=True)
        SectionPartFactory(section=PartSectionFactory(), ref_number='1', part=p)
        order = create_parts_order(customer=_customer(), items=[_item('A-1')])
        resp = client.post('/api/parts/create-payment-intent/', {'order_reference': order.order_reference, 'access_token': order.access_token}, format='json')
        assert resp.status_code == 200
        assert resp.json()['clientSecret'] == 'cs_test'
        assert Payment.objects.filter(parts_order=order, status='pending').count() == 1

    @patch('payments.payment_intents.stripe')
    def test_reuses_existing_pending_payment(self, mock_stripe, client, settings_fixture):
        mock_stripe.PaymentIntent.retrieve.return_value = MagicMock(client_secret='cs_existing')
        p = PartFactory(part_number='A-1', wholesale_price_incl_gst=Decimal('10'), available_qty=5, in_pa_feed=True)
        SectionPartFactory(section=PartSectionFactory(), ref_number='1', part=p)
        order = create_parts_order(customer=_customer(), items=[_item('A-1')])
        Payment.objects.create(parts_order=order, stripe_payment_intent_id='pi_x', amount=order.total, status='pending')
        resp = client.post('/api/parts/create-payment-intent/', {'order_reference': order.order_reference, 'access_token': order.access_token}, format='json')
        assert resp.status_code == 200
        assert resp.json()['clientSecret'] == 'cs_existing'
        mock_stripe.PaymentIntent.create.assert_not_called()
        assert Payment.objects.filter(parts_order=order).count() == 1

    @patch('payments.payment_intents.stripe')
    def test_retry_after_failed_payment_preserves_attempt(self, mock_stripe, client, settings_fixture):
        mock_stripe.PaymentIntent.create.return_value = MagicMock(id='pi_new', client_secret='cs_new')
        p = PartFactory(part_number='A-1', wholesale_price_incl_gst=Decimal('10'), available_qty=5, in_pa_feed=True)
        SectionPartFactory(section=PartSectionFactory(), ref_number='1', part=p)
        order = create_parts_order(customer=_customer(), items=[_item('A-1')])
        Payment.objects.create(parts_order=order, stripe_payment_intent_id='pi_old', amount=order.total, status='failed')
        resp = client.post('/api/parts/create-payment-intent/', {'order_reference': order.order_reference, 'access_token': order.access_token}, format='json')
        assert resp.status_code == 200
        assert resp.json()['clientSecret'] == 'cs_new'
        attempts = Payment.objects.filter(parts_order=order).order_by('created_at')
        assert attempts.count() == 2
        assert list(attempts.values_list('stripe_payment_intent_id', flat=True)) == ['pi_old', 'pi_new']


class TestWebhookPartsBranch:
    def test_paid_marks_order_and_keeps_backorder_flag(self, settings_fixture):
        from payments.utils.webhook_handlers import handle_payment_intent_succeeded
        p = PartFactory(part_number='A-1', wholesale_price_incl_gst=Decimal('10'), available_qty=0, in_pa_feed=True)
        SectionPartFactory(section=PartSectionFactory(), ref_number='1', part=p)
        order = create_parts_order(customer=_customer(), items=[_item('A-1', 2)])
        Payment.objects.create(parts_order=order, stripe_payment_intent_id='pi_x', amount=order.total, status='pending')

        handle_payment_intent_succeeded({'id': 'pi_x'})

        order.refresh_from_db()
        assert order.status == 'paid'
        assert order.amount_paid == order.total
        item = order.items.first()
        assert item.backordered is True
        # The hold clock is derived from the order date, not stamped on payment.
        assert order.backorder_days_remaining(hold_days=14) == 14

    def test_webhook_idempotent(self, settings_fixture):
        from payments.utils.webhook_handlers import handle_payment_intent_succeeded
        p = PartFactory(part_number='A-1', wholesale_price_incl_gst=Decimal('10'), available_qty=5, in_pa_feed=True)
        SectionPartFactory(section=PartSectionFactory(), ref_number='1', part=p)
        order = create_parts_order(customer=_customer(), items=[_item('A-1')])
        Payment.objects.create(parts_order=order, stripe_payment_intent_id='pi_y', amount=order.total, status='pending')
        handle_payment_intent_succeeded({'id': 'pi_y'})
        handle_payment_intent_succeeded({'id': 'pi_y'})  # replay
        order.refresh_from_db()
        assert order.status == 'paid'
