import pytest
from unittest.mock import MagicMock
from django.contrib.contenttypes.models import ContentType

from notifications.models import Message
from notifications.utils.email import send_customer_confirmation, send_admin_new_order, send_admin_reminder
from payments.tests.factories.order_factory import OrderFactory


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
        order = OrderFactory(status='paid')
        send_admin_new_order(order)
        assert 'admin@scootershop.com.au' in mock_post.call_args[1]['data']['to']

    def test_subject_contains_order_reference(self, mock_post, settings):
        settings.ADMIN_EMAIL = 'admin@scootershop.com.au'
        order = OrderFactory(status='paid')
        send_admin_new_order(order)
        assert order.order_reference in mock_post.call_args[1]['data']['subject']

    def test_creates_sent_message_on_success(self, mock_post, settings):
        settings.ADMIN_EMAIL = 'admin@scootershop.com.au'
        order = OrderFactory(status='paid')
        send_admin_new_order(order)
        msg = _messages_for(order, message_type='admin_new_order').get()
        assert msg.status == 'sent'
        assert msg.to == 'admin@scootershop.com.au'
        assert msg.body_html

    def test_skips_if_no_admin_email(self, mock_post, settings):
        settings.ADMIN_EMAIL = None
        order = OrderFactory(status='paid')
        send_admin_new_order(order)
        mock_post.assert_not_called()

    def test_creates_failed_message_on_mailgun_error(self, mocker, settings):
        settings.ADMIN_EMAIL = 'admin@scootershop.com.au'
        mocker.patch('notifications.utils.email.requests.post', side_effect=Exception("timeout"))
        order = OrderFactory(status='paid')
        send_admin_new_order(order)
        msg = _messages_for(order, message_type='admin_new_order').get()
        assert msg.status == 'failed'
        assert 'timeout' in msg.error_message


@pytest.mark.django_db
class TestSendAdminReminder:

    def test_sends_to_admin_email(self, mock_post, settings):
        settings.ADMIN_EMAIL = 'admin@scootershop.com.au'
        order = OrderFactory(status='paid')
        send_admin_reminder(order)
        assert 'admin@scootershop.com.au' in mock_post.call_args[1]['data']['to']

    def test_creates_sent_message_on_success(self, mock_post, settings):
        settings.ADMIN_EMAIL = 'admin@scootershop.com.au'
        order = OrderFactory(status='paid')
        send_admin_reminder(order)
        msg = _messages_for(order, message_type='admin_reminder').get()
        assert msg.status == 'sent'
        assert msg.body_html

    def test_skips_if_no_admin_email(self, mock_post, settings):
        settings.ADMIN_EMAIL = None
        order = OrderFactory(status='paid')
        send_admin_reminder(order)
        mock_post.assert_not_called()
