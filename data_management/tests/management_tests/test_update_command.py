from io import StringIO
from unittest.mock import patch
from django.core.management import call_command
from django.test import TestCase

class UpdateCommandTest(TestCase):

    @patch('data_management.management.commands.update.load_db_from_latest_archive')
    @patch('builtins.input', return_value='yes')
    def test_archive_flag_with_yes_confirmation(self, mock_input, mock_loader):
        """
        Test that --archive with a 'yes' confirmation calls the loader function.
        """
        out = StringIO()
        call_command('update', '--archive', stdout=out)

        self.assertIn('Starting database load from archive...', out.getvalue())
        mock_input.assert_called_once()
        mock_loader.assert_called_once()

    @patch('data_management.management.commands.update.load_db_from_latest_archive')
    @patch('builtins.input', return_value='no')
    def test_archive_flag_with_no_confirmation(self, mock_input, mock_loader):
        """
        Test that --archive with a 'no' confirmation cancels the operation.
        """
        out = StringIO()
        call_command('update', '--archive', stdout=out)

        self.assertIn('Database load cancelled.', out.getvalue())
        mock_input.assert_called_once()
        mock_loader.assert_not_called()

    @patch('data_management.management.commands.update.load_db_from_latest_archive')
    def test_no_flag_provided(self, mock_loader):
        """
        Test that nothing happens if no flags are provided.
        """
        out = StringIO()
        call_command('update', stdout=out)

        self.assertIn('No update flag specified.', out.getvalue())
        mock_loader.assert_not_called()
