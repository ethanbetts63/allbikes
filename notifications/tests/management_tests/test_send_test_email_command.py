import pytest
from unittest.mock import MagicMock
from django.core.management import call_command

from notifications.models import Message


@pytest.fixture(autouse=True)
def mock_mailgun(mocker):
    mock = mocker.patch('notifications.utils.email.requests.post')
    mock.return_value = MagicMock(raise_for_status=MagicMock())
    return mock


@pytest.mark.django_db
class TestSendTestEmailCommand:

    def test_sends_to_admin_email_by_default(self, mock_mailgun, settings):
        """
        GIVEN ADMIN_EMAIL is configured and no --to is provided
        WHEN send_test_email is called
        THEN the email is sent to ADMIN_EMAIL.
        """
        settings.ADMIN_EMAIL = 'admin@scootershop.com.au'
        call_command('send_test_email')
        call_args = mock_mailgun.call_args[1]['data']
        assert 'admin@scootershop.com.au' in call_args['to']

    def test_sends_to_explicit_recipient(self, mock_mailgun, settings):
        """
        GIVEN --to is provided
        WHEN send_test_email is called
        THEN the email is sent to that address.
        """
        settings.ADMIN_EMAIL = 'admin@scootershop.com.au'
        call_command('send_test_email', to='other@example.com')
        call_args = mock_mailgun.call_args[1]['data']
        assert 'other@example.com' in call_args['to']

    def test_aborts_with_no_recipient(self, mock_mailgun, settings, capsys):
        """
        GIVEN no ADMIN_EMAIL and no --to
        WHEN send_test_email is called
        THEN no email is sent and an error is written to stderr.
        """
        settings.ADMIN_EMAIL = None
        call_command('send_test_email')
        mock_mailgun.assert_not_called()
        _, err = capsys.readouterr()
        assert 'No recipient' in err

    def test_default_template_creates_test_email_record(self, mock_mailgun, settings):
        """
        GIVEN the default 'test' template
        WHEN send_test_email is called
        THEN a Message record with type 'test_email' is created.
        """
        settings.ADMIN_EMAIL = 'admin@scootershop.com.au'
        call_command('send_test_email')
        assert Message.objects.filter(message_type='test_email', status='sent').exists()

    def test_customer_confirmation_template_creates_record(self, mock_mailgun, settings):
        """
        GIVEN --template=customer_confirmation
        WHEN send_test_email is called
        THEN a Message record with type 'customer_confirmation' is created.
        """
        settings.ADMIN_EMAIL = 'admin@scootershop.com.au'
        call_command('send_test_email', template='customer_confirmation')
        assert Message.objects.filter(message_type='customer_confirmation', status='sent').exists()

    def test_admin_new_order_template_creates_record(self, mock_mailgun, settings):
        """
        GIVEN --template=admin_new_order
        WHEN send_test_email is called
        THEN a Message record with type 'admin_new_order' is created.
        """
        settings.ADMIN_EMAIL = 'admin@scootershop.com.au'
        call_command('send_test_email', template='admin_new_order')
        assert Message.objects.filter(message_type='admin_new_order', status='sent').exists()

    def test_mailgun_failure_writes_to_stderr(self, mocker, settings, capsys):
        """
        GIVEN Mailgun raises an exception
        WHEN send_test_email is called
        THEN the error is written to stderr and does not propagate.
        """
        settings.ADMIN_EMAIL = 'admin@scootershop.com.au'
        mocker.patch('notifications.utils.email.requests.post', side_effect=Exception('timeout'))
        call_command('send_test_email')
        _, err = capsys.readouterr()
        assert 'Failed' in err
