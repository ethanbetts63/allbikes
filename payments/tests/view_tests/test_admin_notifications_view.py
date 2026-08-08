from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from parts.checkout import create_parts_order
from parts.models import PartsSettings
from parts.tests.factories import PartFactory, PartSectionFactory, SectionPartFactory
from notifications.models import Message

pytestmark = pytest.mark.django_db

URL = '/api/payments/admin/notifications/'


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


def _parts_order(status, part_number='A-1', available=5):
    part = PartFactory(part_number=part_number, wholesale_price_incl_gst=Decimal('100'),
                       available_qty=available, in_pa_feed=True)
    fitment = SectionPartFactory(section=PartSectionFactory(), ref_number='1', part=part)
    order = create_parts_order(
        customer={
            'customer_name': 'Jane Smith', 'customer_email': 'jane@example.com', 'customer_phone': '',
            'address_line1': '1 St', 'suburb': 'Perth', 'state': 'WA', 'postcode': '6000',
            'country': 'Australia', 'terms_accepted': True,
        },
        items=[{'part_number': part_number, 'fitment_key': fitment.fitment_key, 'quantity': 1}],
    )
    order.status = status
    order.save(update_fields=['status', 'updated_at'])
    return order


class TestPartsOrdersToAction:
    def test_requires_admin(self):
        assert APIClient().get(URL).status_code in (401, 403)

    def test_unsettled_orders_are_listed(self, admin_client):
        paid = _parts_order('paid', part_number='A-1')
        data = admin_client.get(URL).json()
        refs = [o['order_reference'] for o in data['parts_orders_to_action']]
        assert refs == [paid.order_reference]

    @pytest.mark.parametrize('status', ['pending_payment', 'completed', 'cancelled', 'refunded'])
    def test_unpaid_or_settled_orders_are_excluded(self, admin_client, status):
        _parts_order(status)
        data = admin_client.get(URL).json()
        assert data['parts_orders_to_action'] == []

    @pytest.mark.parametrize('status', ['paid', 'dispatched', 'partially_refunded'])
    def test_paid_orders_needing_action_are_listed(self, admin_client, status):
        _parts_order(status)
        data = admin_client.get(URL).json()
        assert len(data['parts_orders_to_action']) == 1
        assert data['parts_orders_to_action'][0]['status'] == status

    def test_payload_carries_what_the_dashboard_shows(self, admin_client):
        order = _parts_order('paid', part_number='B-2', available=0)
        row = admin_client.get(URL).json()['parts_orders_to_action'][0]
        assert row['order_reference'] == order.order_reference
        assert row['customer_name'] == 'Jane Smith'
        assert row['item_count'] == 1
        assert row['has_backorder'] is True
        assert row['id'] == order.id

    def test_oldest_first(self, admin_client):
        first = _parts_order('paid', part_number='A-1')
        second = _parts_order('paid', part_number='C-3')
        refs = [o['order_reference'] for o in admin_client.get(URL).json()['parts_orders_to_action']]
        assert refs == [first.order_reference, second.order_reference]

    def test_failed_emails_are_exposed_for_admin_action(self, admin_client):
        failed = Message.objects.create(
            to='customer@example.com', subject='Could not send', message_type='test_email',
            channel='email', status='failed', error_message='Mailgun timeout',
        )
        data = admin_client.get(URL).json()
        assert data['failed_emails'] == [{
            'id': failed.id, 'to': 'customer@example.com', 'subject': 'Could not send',
            'message_type': 'test_email', 'status': 'failed', 'error_message': 'Mailgun timeout',
            'created_at': data['failed_emails'][0]['created_at'],
        }]


class TestInterestEnquiries:
    """The unanswered-enquiry feed behind the Enquiries nav badge."""

    def test_lists_only_unanswered_enquiries_oldest_first(self, admin_client):
        """
        GIVEN two unanswered enquiries and one already replied to
        WHEN admin notifications are fetched
        THEN only the unanswered ones appear, oldest first.
        """
        from django.utils import timezone

        from inventory.models import BikeInterestEnquiry
        from inventory.tests.factories.motorcycle_factory import MotorcycleFactory

        bike = MotorcycleFactory()
        BikeInterestEnquiry.objects.create(motorcycle=bike, email='first@example.com')
        BikeInterestEnquiry.objects.create(motorcycle=bike, email='second@example.com')
        answered = BikeInterestEnquiry.objects.create(motorcycle=bike, email='answered@example.com')
        answered.responded_at = timezone.now()
        answered.save(update_fields=['responded_at'])

        response = admin_client.get(URL)

        assert response.status_code == 200
        rows = response.data['interest_enquiries_to_action']
        assert [row['email'] for row in rows] == ['first@example.com', 'second@example.com']
        assert rows[0]['motorcycle_name'] == str(bike)

    def test_is_empty_when_everything_is_answered(self, admin_client):
        response = admin_client.get(URL)
        assert response.data['interest_enquiries_to_action'] == []
