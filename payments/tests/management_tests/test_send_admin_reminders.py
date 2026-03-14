import pytest
from django.contrib.contenttypes.models import ContentType
from django.core.management import call_command

from notifications.models import Message
from payments.tests.factories.order_factory import OrderFactory


def _messages_for(obj, **kwargs):
    ct = ContentType.objects.get_for_model(obj)
    return Message.objects.filter(content_type=ct, object_id=obj.pk, **kwargs)


@pytest.fixture(autouse=True)
def mock_mailgun(mocker):
    from unittest.mock import MagicMock
    mock = mocker.patch('notifications.utils.email.requests.post')
    mock.return_value = MagicMock(raise_for_status=MagicMock())
    return mock


@pytest.mark.django_db
class TestSendAdminRemindersCommand:

    def test_sends_reminder_for_paid_orders(self, settings):
        settings.ADMIN_EMAIL = 'admin@scootershop.com.au'
        order1 = OrderFactory(status='paid')
        order2 = OrderFactory(status='paid')

        call_command('send_admin_reminders')

        assert _messages_for(order1, message_type='admin_reminder', status='sent').exists()
        assert _messages_for(order2, message_type='admin_reminder', status='sent').exists()

    def test_ignores_dispatched_orders(self, settings):
        settings.ADMIN_EMAIL = 'admin@scootershop.com.au'
        order = OrderFactory(status='dispatched')

        call_command('send_admin_reminders')

        assert not _messages_for(order, message_type='admin_reminder').exists()

    def test_ignores_pending_payment_orders(self, settings):
        settings.ADMIN_EMAIL = 'admin@scootershop.com.au'
        order = OrderFactory(status='pending_payment')

        call_command('send_admin_reminders')

        assert not _messages_for(order, message_type='admin_reminder').exists()

    def test_outputs_count(self, settings, capsys):
        settings.ADMIN_EMAIL = 'admin@scootershop.com.au'
        OrderFactory(status='paid')

        call_command('send_admin_reminders')

        out, _ = capsys.readouterr()
        assert '1' in out
