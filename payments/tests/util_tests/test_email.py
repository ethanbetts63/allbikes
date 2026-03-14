import pytest
from unittest.mock import MagicMock, patch

from payments.models import Notification
from payments.utils.email import send_customer_confirmation, send_admin_new_order, send_admin_reminder
from payments.tests.factories.order_factory import OrderFactory


@pytest.fixture
def mock_post(mocker):
    mock = mocker.patch('payments.utils.email.requests.post')
    mock.return_value = MagicMock(status_code=200, raise_for_status=MagicMock())
    return mock


@pytest.mark.django_db
class TestSendCustomerConfirmation:

    def test_sends_to_customer_email(self, mock_post):
        """
        GIVEN a paid order
        WHEN send_customer_confirmation is called
        THEN Mailgun is called with the customer's email address.
        """
        order = OrderFactory(status='paid')
        send_customer_confirmation(order)

        mock_post.assert_called_once()
        call_data = mock_post.call_args[1]['data']
        assert order.customer_email in call_data['to']

    def test_subject_contains_order_reference(self, mock_post):
        order = OrderFactory(status='paid')
        send_customer_confirmation(order)

        call_data = mock_post.call_args[1]['data']
        assert order.order_reference in call_data['subject']

    def test_creates_sent_notification_on_success(self, mock_post):
        order = OrderFactory(status='paid')
        send_customer_confirmation(order)

        notification = Notification.objects.get(order=order, notification_type='customer_confirmation')
        assert notification.status == 'sent'
        assert notification.sent_at is not None

    def test_creates_failed_notification_on_mailgun_error(self, mocker):
        mocker.patch('payments.utils.email.requests.post', side_effect=Exception("network error"))
        order = OrderFactory(status='paid')
        send_customer_confirmation(order)

        notification = Notification.objects.get(order=order, notification_type='customer_confirmation')
        assert notification.status == 'failed'

    def test_does_not_raise_on_mailgun_error(self, mocker):
        mocker.patch('payments.utils.email.requests.post', side_effect=Exception("network error"))
        order = OrderFactory(status='paid')
        # Should not raise
        send_customer_confirmation(order)


@pytest.mark.django_db
class TestSendAdminNewOrder:

    def test_sends_to_admin_email(self, mock_post, settings):
        settings.ADMIN_EMAIL = 'admin@scootershop.com.au'
        order = OrderFactory(status='paid')
        send_admin_new_order(order)

        mock_post.assert_called_once()
        call_data = mock_post.call_args[1]['data']
        assert 'admin@scootershop.com.au' in call_data['to']

    def test_subject_contains_order_reference(self, mock_post, settings):
        settings.ADMIN_EMAIL = 'admin@scootershop.com.au'
        order = OrderFactory(status='paid')
        send_admin_new_order(order)

        call_data = mock_post.call_args[1]['data']
        assert order.order_reference in call_data['subject']

    def test_creates_sent_notification_on_success(self, mock_post, settings):
        settings.ADMIN_EMAIL = 'admin@scootershop.com.au'
        order = OrderFactory(status='paid')
        send_admin_new_order(order)

        notification = Notification.objects.get(order=order, notification_type='admin_new_order')
        assert notification.status == 'sent'

    def test_skips_and_does_not_call_mailgun_if_no_admin_email(self, mock_post, settings):
        settings.ADMIN_EMAIL = None
        order = OrderFactory(status='paid')
        send_admin_new_order(order)

        mock_post.assert_not_called()

    def test_creates_failed_notification_on_mailgun_error(self, mocker, settings):
        settings.ADMIN_EMAIL = 'admin@scootershop.com.au'
        mocker.patch('payments.utils.email.requests.post', side_effect=Exception("timeout"))
        order = OrderFactory(status='paid')
        send_admin_new_order(order)

        notification = Notification.objects.get(order=order, notification_type='admin_new_order')
        assert notification.status == 'failed'


@pytest.mark.django_db
class TestSendAdminReminder:

    def test_sends_to_admin_email(self, mock_post, settings):
        settings.ADMIN_EMAIL = 'admin@scootershop.com.au'
        order = OrderFactory(status='paid')
        send_admin_reminder(order)

        mock_post.assert_called_once()
        call_data = mock_post.call_args[1]['data']
        assert 'admin@scootershop.com.au' in call_data['to']

    def test_subject_contains_order_reference(self, mock_post, settings):
        settings.ADMIN_EMAIL = 'admin@scootershop.com.au'
        order = OrderFactory(status='paid')
        send_admin_reminder(order)

        call_data = mock_post.call_args[1]['data']
        assert order.order_reference in call_data['subject']

    def test_creates_sent_notification_on_success(self, mock_post, settings):
        settings.ADMIN_EMAIL = 'admin@scootershop.com.au'
        order = OrderFactory(status='paid')
        send_admin_reminder(order)

        notification = Notification.objects.get(order=order, notification_type='admin_reminder')
        assert notification.status == 'sent'

    def test_skips_if_no_admin_email(self, mock_post, settings):
        settings.ADMIN_EMAIL = None
        order = OrderFactory(status='paid')
        send_admin_reminder(order)

        mock_post.assert_not_called()
