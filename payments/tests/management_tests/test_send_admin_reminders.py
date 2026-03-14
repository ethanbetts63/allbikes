import pytest
from django.core.management import call_command

from payments.models import Notification
from payments.tests.factories.order_factory import OrderFactory


@pytest.fixture(autouse=True)
def mock_mailgun(mocker):
    from unittest.mock import MagicMock
    mock = mocker.patch('payments.utils.email.requests.post')
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

        assert Notification.objects.filter(
            order=order1, notification_type='admin_reminder', status='sent',
        ).exists()
        assert Notification.objects.filter(
            order=order2, notification_type='admin_reminder', status='sent',
        ).exists()

    def test_ignores_dispatched_orders(self, settings):
        """
        GIVEN a dispatched order
        WHEN send_admin_reminders is run
        THEN no reminder is sent for it.
        """
        settings.ADMIN_EMAIL = 'admin@scootershop.com.au'
        order = OrderFactory(status='dispatched')

        call_command('send_admin_reminders')

        assert not Notification.objects.filter(order=order, notification_type='admin_reminder').exists()

    def test_ignores_pending_payment_orders(self, settings):
        """
        GIVEN a pending_payment order
        WHEN send_admin_reminders is run
        THEN no reminder is sent for it.
        """
        settings.ADMIN_EMAIL = 'admin@scootershop.com.au'
        order = OrderFactory(status='pending_payment')

        call_command('send_admin_reminders')

        assert not Notification.objects.filter(order=order, notification_type='admin_reminder').exists()

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
