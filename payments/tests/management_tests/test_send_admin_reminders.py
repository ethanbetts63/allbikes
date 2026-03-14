import pytest
from django.contrib.contenttypes.models import ContentType
from django.core.management import call_command

from notifications.models import Notification
from payments.tests.factories.order_factory import OrderFactory


def _notifs_for(obj, **kwargs):
    ct = ContentType.objects.get_for_model(obj)
    return Notification.objects.filter(content_type=ct, object_id=obj.pk, **kwargs)


@pytest.fixture(autouse=True)
def mock_mailgun(mocker):
    from unittest.mock import MagicMock
    mock = mocker.patch('notifications.utils.email.requests.post')
    mock.return_value = MagicMock(raise_for_status=MagicMock())
    return mock


@pytest.mark.django_db
class TestSendAdminRemindersCommand:

    def test_sends_reminder_for_paid_orders(self, settings):
        """
        GIVEN two paid orders
        WHEN send_admin_reminders is run
        THEN a reminder Notification is created for each.
        """
        settings.ADMIN_EMAIL = 'admin@scootershop.com.au'
        order1 = OrderFactory(status='paid')
        order2 = OrderFactory(status='paid')

        call_command('send_admin_reminders')

        assert _notifs_for(order1, notification_type='admin_reminder', status='sent').exists()
        assert _notifs_for(order2, notification_type='admin_reminder', status='sent').exists()

    def test_ignores_dispatched_orders(self, settings):
        """
        GIVEN a dispatched order
        WHEN send_admin_reminders is run
        THEN no reminder is sent for it.
        """
        settings.ADMIN_EMAIL = 'admin@scootershop.com.au'
        order = OrderFactory(status='dispatched')

        call_command('send_admin_reminders')

        assert not _notifs_for(order, notification_type='admin_reminder').exists()

    def test_ignores_pending_payment_orders(self, settings):
        """
        GIVEN a pending_payment order
        WHEN send_admin_reminders is run
        THEN no reminder is sent for it.
        """
        settings.ADMIN_EMAIL = 'admin@scootershop.com.au'
        order = OrderFactory(status='pending_payment')

        call_command('send_admin_reminders')

        assert not _notifs_for(order, notification_type='admin_reminder').exists()

    def test_outputs_count(self, settings, capsys):
        """
        GIVEN one paid order
        WHEN send_admin_reminders is run
        THEN stdout reports the count.
        """
        settings.ADMIN_EMAIL = 'admin@scootershop.com.au'
        OrderFactory(status='paid')

        call_command('send_admin_reminders')

        out, _ = capsys.readouterr()
        assert '1' in out
