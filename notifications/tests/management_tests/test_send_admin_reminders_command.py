import pytest
import datetime
from unittest.mock import patch
from django.core.management import call_command
from django.utils import timezone
from payments.tests.factories.order_factory import OrderFactory
from notifications.models import Message

@pytest.mark.django_db
class TestSendAdminRemindersCommand:

    @pytest.fixture
    def mock_send_mailgun(self):
        with patch('notifications.management.commands.send_admin_reminders._send_mailgun') as mock:
            yield mock

    @pytest.fixture
    def mock_admin_recipients(self):
        with patch('notifications.management.commands.send_admin_reminders._admin_recipients') as mock:
            mock.return_value = ['admin@example.com']
            yield mock

    def test_skips_if_not_monday_and_no_force(self, capsys, mock_send_mailgun):
        # Mock timezone.now to return a Tuesday
        # Tuesday is 1 (Monday is 0)
        tuesday = datetime.datetime(2023, 1, 3, tzinfo=datetime.timezone.utc)
        
        with patch('django.utils.timezone.now', return_value=tuesday):
            call_command('send_admin_reminders')
            
        captured = capsys.readouterr()
        assert "Not Monday — skipping" in captured.out
        mock_send_mailgun.assert_not_called()

    def test_runs_if_force_used_on_non_monday(self, capsys, mock_send_mailgun, mock_admin_recipients):
        tuesday = datetime.datetime(2023, 1, 3, tzinfo=datetime.timezone.utc)
        
        # Create an order so there is something to send
        OrderFactory(status='paid')

        with patch('django.utils.timezone.now', return_value=tuesday):
            # Also mock render_to_string to avoid template errors if template missing
            with patch('notifications.management.commands.send_admin_reminders.render_to_string', return_value="<html></html>"):
                call_command('send_admin_reminders', '--force')
            
        captured = capsys.readouterr()
        assert "Sent weekly summary" in captured.out
        mock_send_mailgun.assert_called_once()

    def test_skips_if_admin_email_not_configured(self, capsys, mock_send_mailgun):
        with patch('notifications.management.commands.send_admin_reminders._admin_recipients', return_value=[]):
            # Use Monday
            monday = datetime.datetime(2023, 1, 2, tzinfo=datetime.timezone.utc)
            with patch('django.utils.timezone.now', return_value=monday):
                call_command('send_admin_reminders')

        captured = capsys.readouterr()
        assert "No admin emails are configured" in captured.err
        mock_send_mailgun.assert_not_called()

    def test_skips_if_no_orders(self, capsys, mock_send_mailgun, mock_admin_recipients):
        monday = datetime.datetime(2023, 1, 2, tzinfo=datetime.timezone.utc)
        
        with patch('django.utils.timezone.now', return_value=monday):
             call_command('send_admin_reminders')
             
        captured = capsys.readouterr()
        assert "No paid orders" in captured.out
        mock_send_mailgun.assert_not_called()

    def test_sends_email_with_orders(self, capsys, mock_send_mailgun, mock_admin_recipients):
        monday = datetime.datetime(2023, 1, 2, tzinfo=datetime.timezone.utc)
        
        order1 = OrderFactory(status='paid', order_reference='REF1')
        order2 = OrderFactory(status='paid', order_reference='REF2')

        with patch('django.utils.timezone.now', return_value=monday):
            with patch('notifications.management.commands.send_admin_reminders.render_to_string', return_value="<html>Orders</html>"):
                call_command('send_admin_reminders')

        mock_send_mailgun.assert_called_once()
        args, kwargs = mock_send_mailgun.call_args
        assert kwargs['to'] == 'admin@example.com'
        assert 'Weekly order summary' in kwargs['subject']
        assert 'REF1' in kwargs['text_body']
        assert 'REF2' in kwargs['text_body']
        
        # Verify Message record created
        assert Message.objects.count() == 1
        msg = Message.objects.first()
        assert msg.message_type == 'admin_weekly_summary'
        assert msg.status == 'sent'

    def test_sends_email_to_all_admin_recipients(self, capsys, mock_send_mailgun):
        monday = datetime.datetime(2023, 1, 2, tzinfo=datetime.timezone.utc)
        OrderFactory(status='paid', order_reference='REF1')

        with patch('notifications.management.commands.send_admin_reminders._admin_recipients', return_value=['admin1@example.com', 'admin2@example.com']):
            with patch('django.utils.timezone.now', return_value=monday):
                with patch('notifications.management.commands.send_admin_reminders.render_to_string', return_value="<html>Orders</html>"):
                    call_command('send_admin_reminders')

        recipients = [call.kwargs['to'] for call in mock_send_mailgun.call_args_list]
        assert recipients == ['admin1@example.com', 'admin2@example.com']
        assert Message.objects.filter(message_type='admin_weekly_summary', status='sent').count() == 2

    def test_handles_send_error(self, capsys, mock_send_mailgun, mock_admin_recipients):
        monday = datetime.datetime(2023, 1, 2, tzinfo=datetime.timezone.utc)
        OrderFactory(status='paid')
        
        mock_send_mailgun.side_effect = Exception("Mailgun error")
        
        with patch('django.utils.timezone.now', return_value=monday):
            with patch('notifications.management.commands.send_admin_reminders.render_to_string', return_value="<html>Orders</html>"):
                call_command('send_admin_reminders')
        
        captured = capsys.readouterr()
        assert "Failed to send to admin@example.com: Mailgun error" in captured.err
        
        # Verify Message record created with failed status
        assert Message.objects.count() == 1
        msg = Message.objects.first()
        assert msg.status == 'failed'
        assert 'Mailgun error' in msg.error_message
