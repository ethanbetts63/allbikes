from io import StringIO
from unittest.mock import patch
from django.core.management import call_command
from django.test import TestCase

class GenerateCommandTest(TestCase):

    @patch('data_management.management.commands.generate.TermsUpdateOrchestrator')
    def test_terms_flag_calls_terms_orchestrator(self, mock_orchestrator):
        """
        Test that the --terms flag correctly calls the TermsUpdateOrchestrator.
        """
        call_command('generate', '--terms')
        mock_orchestrator.assert_called_once()
        mock_orchestrator.return_value.run.assert_called_once()

    @patch('data_management.management.commands.generate.BrandUpdateOrchestrator')
    def test_brands_flag_calls_brand_orchestrator(self, mock_orchestrator):
        """
        Test that the --brands flag correctly calls the BrandUpdateOrchestrator.
        """
        call_command('generate', '--brands')
        mock_orchestrator.assert_called_once()
        mock_orchestrator.return_value.run.assert_called_once()

    @patch('data_management.management.commands.generate.DatabaseArchiver')
    def test_archive_flag_calls_database_archiver(self, mock_archiver):
        """
        Test that the --archive flag correctly calls the DatabaseArchiver.
        """
        call_command('generate', '--archive')
        mock_archiver.assert_called_once()
        mock_archiver.return_value.run.assert_called_once()

    @patch('data_management.management.commands.generate.TermsUpdateOrchestrator')
    @patch('data_management.management.commands.generate.BrandUpdateOrchestrator')
    @patch('data_management.management.commands.generate.DatabaseArchiver')
    def test_no_flags(self, mock_db_archiver, mock_brand_orchestrator, mock_terms_orchestrator):
        """
        Test that no orchestrators are called when no flags are provided.
        """
        out = StringIO()
        call_command('generate', stdout=out)
        
        self.assertIn('No generation flag specified', out.getvalue())
        mock_db_archiver.assert_not_called()
        mock_brand_orchestrator.assert_not_called()
        mock_terms_orchestrator.assert_not_called()

    @patch('data_management.management.commands.generate.TermsUpdateOrchestrator')
    @patch('data_management.management.commands.generate.BrandUpdateOrchestrator')
    def test_multiple_flags(self, mock_brand_orchestrator, mock_terms_orchestrator):
        """
        Test that multiple flags call their respective orchestrators.
        """
        call_command('generate', '--terms', '--brands')
        mock_terms_orchestrator.assert_called_once()
        mock_terms_orchestrator.return_value.run.assert_called_once()
        mock_brand_orchestrator.assert_called_once()
        mock_brand_orchestrator.return_value.run.assert_called_once()
