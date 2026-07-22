import pytest
from datetime import timedelta
from unittest.mock import patch
from django.core.management import call_command
from django.utils import timezone
from service.models import Booking
from service.tests.factories import ServiceSettingsFactory, BookingFactory


@pytest.mark.django_db
class TestServiceRemindersCommand:
    def test_skips_when_disabled(self):
        ServiceSettingsFactory(reminder_emails_enabled=False, reminder_days_before=1)
        BookingFactory(drop_off_date=timezone.localdate() + timedelta(days=1))
        with patch('notifications.management.commands.send_service_reminders.send_service_reminder') as mock_send:
            call_command('send_service_reminders')
            mock_send.assert_not_called()

    def test_sends_for_due_bookings_and_stamps(self):
        ServiceSettingsFactory(reminder_emails_enabled=True, reminder_days_before=1)
        due = BookingFactory(drop_off_date=timezone.localdate() + timedelta(days=1))
        BookingFactory(drop_off_date=timezone.localdate() + timedelta(days=5))  # not due

        with patch('notifications.management.commands.send_service_reminders.send_service_reminder', return_value=True) as mock_send:
            call_command('send_service_reminders')
            assert mock_send.call_count == 1

        due.refresh_from_db()
        assert due.reminder_sent_at is not None

    def test_does_not_resend_already_reminded(self):
        ServiceSettingsFactory(reminder_emails_enabled=True, reminder_days_before=1)
        BookingFactory(
            drop_off_date=timezone.localdate() + timedelta(days=1),
            reminder_sent_at=timezone.now(),
        )
        with patch('notifications.management.commands.send_service_reminders.send_service_reminder') as mock_send:
            call_command('send_service_reminders')
            mock_send.assert_not_called()

    def test_excludes_finished(self):
        ServiceSettingsFactory(reminder_emails_enabled=True, reminder_days_before=1)
        BookingFactory(
            drop_off_date=timezone.localdate() + timedelta(days=1),
            status=Booking.Status.FINISHED,
        )
        with patch('notifications.management.commands.send_service_reminders.send_service_reminder') as mock_send:
            call_command('send_service_reminders')
            mock_send.assert_not_called()
