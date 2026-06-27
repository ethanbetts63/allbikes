import pytest
from unittest.mock import MagicMock
from django.contrib.contenttypes.models import ContentType

from notifications.models import Message
from notifications.utils.email import send_admin_service_booking, send_customer_confirmation, send_admin_new_order
from payments.tests.factories.order_factory import OrderFactory
from service.tests.factories.booking_request_log_factory import BookingRequestLogFactory


def _messages_for(obj, **kwargs):
    ct = ContentType.objects.get_for_model(obj)
    return Message.objects.filter(content_type=ct, object_id=obj.pk, **kwargs)


@pytest.fixture
def mock_post(mocker):
    mock = mocker.patch('notifications.utils.email.requests.post')
    mock.return_value = MagicMock(raise_for_status=MagicMock())
    return mock


@pytest.mark.django_db
class TestSendCustomerConfirmation:

    def test_sends_to_customer_email(self, mock_post):
        order = OrderFactory(status='paid')
        send_customer_confirmation(order)
        assert order.customer_email in mock_post.call_args[1]['data']['to']

    def test_subject_contains_order_reference(self, mock_post):
        order = OrderFactory(status='paid')
        send_customer_confirmation(order)
        assert order.order_reference in mock_post.call_args[1]['data']['subject']

    def test_creates_sent_message_on_success(self, mock_post):
        order = OrderFactory(status='paid')
        send_customer_confirmation(order)
        msg = _messages_for(order, message_type='customer_confirmation').get()
        assert msg.status == 'sent'
        assert msg.to == order.customer_email
        assert msg.subject
        assert msg.body_html
        assert msg.body_text
        assert msg.sent_at is not None
        assert msg.channel == 'email'

    def test_stores_html_body(self, mock_post):
        order = OrderFactory(status='paid')
        send_customer_confirmation(order)
        msg = _messages_for(order, message_type='customer_confirmation').get()
        assert order.order_reference in msg.body_html

    def test_creates_failed_message_on_mailgun_error(self, mocker):
        mocker.patch('notifications.utils.email.requests.post', side_effect=Exception("network error"))
        order = OrderFactory(status='paid')
        send_customer_confirmation(order)
        msg = _messages_for(order, message_type='customer_confirmation').get()
        assert msg.status == 'failed'
        assert 'network error' in msg.error_message

    def test_does_not_raise_on_mailgun_error(self, mocker):
        mocker.patch('notifications.utils.email.requests.post', side_effect=Exception("network error"))
        order = OrderFactory(status='paid')
        send_customer_confirmation(order)  # must not raise


@pytest.mark.django_db
class TestSendAdminNewOrder:

    def test_sends_to_admin_email(self, mock_post, settings):
        settings.ADMIN_EMAIL = 'admin@scootershop.com.au'
        settings.ADMIN_EMAILS = ['admin@scootershop.com.au']
        order = OrderFactory(status='paid')
        send_admin_new_order(order)
        assert 'admin@scootershop.com.au' in mock_post.call_args[1]['data']['to']

    def test_sends_to_all_admin_emails(self, mock_post, settings):
        settings.ADMIN_EMAILS = ['admin1@example.com', 'admin2@example.com']
        order = OrderFactory(status='paid')
        send_admin_new_order(order)
        recipients = [call.kwargs['data']['to'][0] for call in mock_post.call_args_list]
        assert recipients == ['admin1@example.com', 'admin2@example.com']
        assert _messages_for(order, message_type='admin_new_order').count() == 2

    def test_subject_contains_order_reference(self, mock_post, settings):
        settings.ADMIN_EMAIL = 'admin@scootershop.com.au'
        settings.ADMIN_EMAILS = ['admin@scootershop.com.au']
        order = OrderFactory(status='paid')
        send_admin_new_order(order)
        assert order.order_reference in mock_post.call_args[1]['data']['subject']

    def test_creates_sent_message_on_success(self, mock_post, settings):
        settings.ADMIN_EMAIL = 'admin@scootershop.com.au'
        settings.ADMIN_EMAILS = ['admin@scootershop.com.au']
        order = OrderFactory(status='paid')
        send_admin_new_order(order)
        msg = _messages_for(order, message_type='admin_new_order').get()
        assert msg.status == 'sent'
        assert msg.to == 'admin@scootershop.com.au'
        assert msg.body_html

    def test_skips_if_no_admin_email(self, mock_post, settings):
        settings.ADMIN_EMAIL = None
        settings.ADMIN_EMAILS = []
        order = OrderFactory(status='paid')
        send_admin_new_order(order)
        mock_post.assert_not_called()

    def test_creates_failed_message_on_mailgun_error(self, mocker, settings):
        settings.ADMIN_EMAIL = 'admin@scootershop.com.au'
        settings.ADMIN_EMAILS = ['admin@scootershop.com.au']
        mocker.patch('notifications.utils.email.requests.post', side_effect=Exception("timeout"))
        order = OrderFactory(status='paid')
        send_admin_new_order(order)
        msg = _messages_for(order, message_type='admin_new_order').get()
        assert msg.status == 'failed'
        assert 'timeout' in msg.error_message


@pytest.mark.django_db
class TestSendAdminServiceBooking:

    def _booking_data(self):
        return {
            'first_name': 'Jane',
            'last_name': 'Rider',
            'name': 'Jane Rider',
            'phone': '0400 000 000',
            'email': 'jane@example.com',
            'make': 'Vespa',
            'model': 'GTS',
            'registration_number': '1ABC123',
            'drop_off_time': '01/07/2026 09:00',
            'job_type_names': ['Service', 'Tyres'],
            'courtesy_vehicle_requested': 'false',
            'note': 'Preferred drop-off time: 01/07/2026 09:00',
        }

    def test_sends_to_all_admin_emails(self, mock_post, settings):
        settings.ADMIN_EMAILS = ['admin1@example.com', 'admin2@example.com']
        booking_log = BookingRequestLogFactory()
        send_admin_service_booking(self._booking_data(), booking_log)
        recipients = [call.kwargs['data']['to'][0] for call in mock_post.call_args_list]
        assert recipients == ['admin1@example.com', 'admin2@example.com']
        assert _messages_for(booking_log, message_type='admin_service_booking').count() == 2

    def test_records_failure_per_recipient(self, mocker, settings):
        settings.ADMIN_EMAILS = ['admin@example.com']
        mocker.patch('notifications.utils.email.requests.post', side_effect=Exception("timeout"))
        booking_log = BookingRequestLogFactory()
        send_admin_service_booking(self._booking_data(), booking_log)
        msg = _messages_for(booking_log, message_type='admin_service_booking').get()
        assert msg.status == 'failed'
        assert 'timeout' in msg.error_message


