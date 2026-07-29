from decimal import Decimal
from unittest.mock import MagicMock

import pytest

from notifications.models import Message
from notifications.utils import email as email_utils
from notifications.utils import sms_messages
from parts.checkout import create_parts_order
from parts.models import PartsSettings
from parts.tests.factories import PartFactory, PartSectionFactory, SectionPartFactory

pytestmark = pytest.mark.django_db


@pytest.fixture(autouse=True)
def parts_settings():
    s = PartsSettings.get()
    s.markup_percentage = Decimal('20')
    s.shipping_fee = Decimal('15')
    s.backorder_hold_days = 11
    s.save()
    return s


def _order(available=5, qty=1, part='A-1', colour='Red'):
    p = PartFactory(part_number=part, wholesale_price_incl_gst=Decimal('100'),
                    available_qty=available, in_pa_feed=True, colour_name=colour)
    fitment = SectionPartFactory(section=PartSectionFactory(name='Shroud Assy'), ref_number='1', part=p)
    return create_parts_order(customer={
        'customer_name': 'Jane Smith', 'customer_email': 'jane@example.com', 'customer_phone': '0400000000',
        'address_line1': '1 Test St', 'suburb': 'Dianella', 'state': 'WA', 'postcode': '6059',
        'country': 'Australia', 'terms_accepted': True,
    }, items=[{'part_number': part, 'fitment_key': fitment.fitment_key, 'quantity': qty}])


class TestCustomerConfirmation:
    def test_sends_and_records_details(self):
        order = _order()
        email_utils.send_parts_customer_confirmation(order)
        msg = Message.objects.get(message_type='parts_customer_confirmation')
        assert msg.status == 'sent'
        assert msg.to == 'jane@example.com'
        assert order.order_reference in msg.subject
        # itemised, marked-up price, address, and the email-us instruction
        assert 'A-1' in msg.body_text and 'Red' in msg.body_text
        assert '120.00' in msg.body_text  # 100 * 1.20
        assert 'Dianella' in msg.body_text
        assert '/refunds' in msg.body_text
        assert 'A-1' in msg.body_html

    def test_backorder_note_when_understocked(self):
        order = _order(available=0, qty=2)
        email_utils.send_parts_customer_confirmation(order)
        msg = Message.objects.get(message_type='parts_customer_confirmation')
        assert 'backorder' in msg.body_text.lower()
        assert '11 days' in msg.body_text

    def test_no_confirm_before_dispatch_language(self):
        order = _order()
        email_utils.send_parts_customer_confirmation(order)
        msg = Message.objects.get(message_type='parts_customer_confirmation')
        assert 'confirm before dispatch' not in msg.body_text.lower()
        assert 'confirm before dispatch' not in msg.body_html.lower()


class TestAdminNewOrder:
    def test_sends_to_admin_with_wholesaler_detail(self, settings, monkeypatch):
        settings.ADMIN_EMAILS = ['ops@test.com']
        sms = MagicMock()
        monkeypatch.setattr(email_utils, '_send_admin_sms', sms)
        order = _order()
        email_utils.send_parts_admin_new_order(order)
        msg = Message.objects.get(message_type='parts_admin_new_order', to='ops@test.com')
        assert msg.status == 'sent'
        assert 'A-1' in msg.body_text
        # model/section context (snapshotted) is present for wholesaler lookup
        item = order.items.first()
        assert item.model_name in msg.body_text
        assert item.section_code in msg.body_text
        sms.assert_called_once()

    def test_skips_when_no_admins(self, settings):
        settings.ADMIN_EMAILS = []
        settings.ADMIN_EMAIL = None
        order = _order()
        email_utils.send_parts_admin_new_order(order)
        assert not Message.objects.filter(message_type='parts_admin_new_order').exists()


class TestSmsCopy:
    def test_admin_new_parts_order(self):
        order = _order()
        text = sms_messages.admin_new_parts_order(order)
        assert order.order_reference in text
        assert '1 item' in text
        assert 'Jane Smith' in text


class TestSupplierDispatch:
    def test_sends_operator_reviewed_copy_and_records_it(self):
        order = _order()
        assert email_utils.send_parts_supplier_dispatch(
            order, to='supplier@test.com', subject='Order', text_body='Hello supplier',
        ) is True
        msg = Message.objects.get(message_type='parts_wholesaler_dispatch')
        assert msg.to == 'supplier@test.com'
        assert msg.subject == 'Order'
        assert msg.body_text == 'Hello supplier'
        assert msg.status == 'sent'


class TestWebhookIntegration:
    def test_paid_sends_both_emails(self, settings, monkeypatch):
        settings.ADMIN_EMAILS = ['ops@test.com']
        monkeypatch.setattr(email_utils, '_send_admin_sms', MagicMock())
        from payments.models import Payment
        from payments.utils.webhook_handlers import handle_payment_intent_succeeded
        order = _order()
        Payment.objects.create(parts_order=order, stripe_payment_intent_id='pi_z', amount=order.total, status='pending')
        handle_payment_intent_succeeded({'id': 'pi_z'})
        assert Message.objects.filter(message_type='parts_customer_confirmation').exists()
        assert Message.objects.filter(message_type='parts_admin_new_order').exists()
