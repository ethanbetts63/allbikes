import pytest
from unittest.mock import MagicMock
from django.contrib.contenttypes.models import ContentType

from notifications.models import Message
from notifications.utils.email import send_hire_confirmation, send_admin_new_hire
from hire.tests.factories.hire_booking_factory import HireBookingFactory


def _messages_for(obj, **kwargs):
    ct = ContentType.objects.get_for_model(obj)
    return Message.objects.filter(content_type=ct, object_id=obj.pk, **kwargs)


@pytest.fixture
def mock_post(mocker):
    mock = mocker.patch('notifications.utils.email.requests.post')
    mock.return_value = MagicMock(raise_for_status=MagicMock())
    return mock


@pytest.mark.django_db
class TestSendHireConfirmation:

    def test_sends_to_customer_email(self, mock_post):
        """
        GIVEN a hire booking
        WHEN send_hire_confirmation is called
        THEN the email is sent to the customer's email address.
        """
        booking = HireBookingFactory()
        send_hire_confirmation(booking)
        assert booking.customer_email in mock_post.call_args[1]['data']['to']

    def test_subject_contains_booking_reference(self, mock_post):
        """
        GIVEN a hire booking
        WHEN send_hire_confirmation is called
        THEN the email subject contains the booking reference.
        """
        booking = HireBookingFactory()
        send_hire_confirmation(booking)
        assert booking.booking_reference in mock_post.call_args[1]['data']['subject']

    def test_creates_sent_message_record(self, mock_post):
        """
        GIVEN a successful Mailgun send
        WHEN send_hire_confirmation is called
        THEN a Message record with status='sent' is created.
        """
        booking = HireBookingFactory()
        send_hire_confirmation(booking)
        msg = _messages_for(booking, message_type='hire_confirmation').get()
        assert msg.status == 'sent'
        assert msg.to == booking.customer_email
        assert msg.body_html
        assert msg.body_text
        assert msg.sent_at is not None
        assert msg.channel == 'email'

    def test_html_body_contains_booking_reference(self, mock_post):
        """
        GIVEN a hire booking
        WHEN send_hire_confirmation is called
        THEN the recorded HTML body contains the booking reference.
        """
        booking = HireBookingFactory()
        send_hire_confirmation(booking)
        msg = _messages_for(booking, message_type='hire_confirmation').get()
        assert booking.booking_reference in msg.body_html

    def test_creates_failed_message_on_mailgun_error(self, mocker):
        """
        GIVEN Mailgun raises an exception
        WHEN send_hire_confirmation is called
        THEN a Message record with status='failed' is saved.
        """
        mocker.patch('notifications.utils.email.requests.post', side_effect=Exception('timeout'))
        booking = HireBookingFactory()
        send_hire_confirmation(booking)
        msg = _messages_for(booking, message_type='hire_confirmation').get()
        assert msg.status == 'failed'
        assert 'timeout' in msg.error_message

    def test_does_not_raise_on_mailgun_error(self, mocker):
        """
        GIVEN Mailgun raises an exception
        WHEN send_hire_confirmation is called
        THEN no exception propagates to the caller.
        """
        mocker.patch('notifications.utils.email.requests.post', side_effect=Exception('timeout'))
        booking = HireBookingFactory()
        send_hire_confirmation(booking)  # must not raise


@pytest.mark.django_db
class TestSendAdminNewHire:

    def test_sends_to_admin_email(self, mock_post, settings):
        """
        GIVEN ADMIN_EMAIL is configured
        WHEN send_admin_new_hire is called
        THEN the email is sent to ADMIN_EMAIL.
        """
        settings.ADMIN_EMAIL = 'admin@example.com'
        booking = HireBookingFactory()
        send_admin_new_hire(booking)
        assert 'admin@example.com' in mock_post.call_args[1]['data']['to']

    def test_subject_contains_booking_reference(self, mock_post, settings):
        """
        GIVEN ADMIN_EMAIL is configured
        WHEN send_admin_new_hire is called
        THEN the email subject contains the booking reference.
        """
        settings.ADMIN_EMAIL = 'admin@example.com'
        booking = HireBookingFactory()
        send_admin_new_hire(booking)
        assert booking.booking_reference in mock_post.call_args[1]['data']['subject']

    def test_creates_sent_message_record(self, mock_post, settings):
        """
        GIVEN ADMIN_EMAIL is configured and send succeeds
        WHEN send_admin_new_hire is called
        THEN a Message record with status='sent' is saved.
        """
        settings.ADMIN_EMAIL = 'admin@example.com'
        booking = HireBookingFactory()
        send_admin_new_hire(booking)
        msg = _messages_for(booking, message_type='admin_new_hire').get()
        assert msg.status == 'sent'
        assert msg.to == 'admin@example.com'
        assert msg.body_html

    def test_skips_send_when_admin_email_not_configured(self, mock_post, settings):
        """
        GIVEN ADMIN_EMAIL is not set
        WHEN send_admin_new_hire is called
        THEN no email is sent and no Message record is created.
        """
        settings.ADMIN_EMAIL = None
        booking = HireBookingFactory()
        send_admin_new_hire(booking)
        mock_post.assert_not_called()
        assert _messages_for(booking, message_type='admin_new_hire').count() == 0

    def test_creates_failed_message_on_mailgun_error(self, mocker, settings):
        """
        GIVEN ADMIN_EMAIL is configured but Mailgun raises
        WHEN send_admin_new_hire is called
        THEN a Message record with status='failed' is saved.
        """
        settings.ADMIN_EMAIL = 'admin@example.com'
        mocker.patch('notifications.utils.email.requests.post', side_effect=Exception('network error'))
        booking = HireBookingFactory()
        send_admin_new_hire(booking)
        msg = _messages_for(booking, message_type='admin_new_hire').get()
        assert msg.status == 'failed'
        assert 'network error' in msg.error_message
