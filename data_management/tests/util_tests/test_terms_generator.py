import os
import pytest
from unittest.mock import MagicMock, patch
from data_management.utils.generation_utils.terms_generator import TermsUpdateOrchestrator
from data_management.models import TermsAndConditions


@pytest.mark.django_db
class TestTermsUpdateOrchestrator:

    @pytest.fixture
    def mock_command(self):
        command = MagicMock()
        command.style.SUCCESS = lambda x: x
        command.style.WARNING = lambda x: x
        command.style.ERROR = lambda x: x
        command.style.NOTICE = lambda x: x
        return command

    @pytest.fixture
    def orchestrator(self, mock_command, tmp_path):
        with patch('data_management.utils.generation_utils.terms_generator.settings') as mock_settings:
            mock_settings.BASE_DIR = str(tmp_path)
            data_dir = tmp_path / 'data_management' / 'data'
            os.makedirs(data_dir, exist_ok=True)

            orchestrator = TermsUpdateOrchestrator(mock_command)
            orchestrator.data_dir = str(data_dir)

            return orchestrator

    def test_run_finds_and_processes_files(self, orchestrator):
        """
        GIVEN a terms_hire.html file in the data dir
        WHEN run() is called
        THEN process_file is called with that filename.
        """
        terms_file = os.path.join(orchestrator.data_dir, 'terms_hire.html')
        with open(terms_file, 'w') as f:
            f.write("<h1>Hire Terms</h1>")

        orchestrator.process_file = MagicMock()
        orchestrator.run()

        orchestrator.process_file.assert_called_with('terms_hire.html')
        orchestrator.command.stdout.write.assert_called()

    def test_run_handles_no_files(self, orchestrator):
        """
        GIVEN no terms files in the data dir
        WHEN run() is called
        THEN a warning is logged.
        """
        orchestrator.run()

        args_list = orchestrator.command.stdout.write.call_args_list
        found = any("No 'terms_{type}.html' files found." in str(call) for call in args_list)
        assert found

    def test_process_file_creates_terms(self, orchestrator):
        """
        GIVEN a terms_hire.html file
        WHEN process_file is called
        THEN a TermsAndConditions record is created with term_type='hire'.
        """
        file_name = 'terms_hire.html'
        file_path = os.path.join(orchestrator.data_dir, file_name)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write("<h1>Hire Terms Content</h1>")

        orchestrator.process_file(file_name)

        assert TermsAndConditions.objects.count() == 1
        terms = TermsAndConditions.objects.first()
        assert terms.term_type == 'hire'
        assert terms.content == "<h1>Hire Terms Content</h1>"

    def test_process_file_updates_existing_terms(self, orchestrator):
        """
        GIVEN an existing hire TermsAndConditions record
        WHEN process_file is called with a new version of terms_hire.html
        THEN the existing record is updated in place (upsert).
        """
        TermsAndConditions.objects.create(term_type='hire', content='Old content')

        file_name = 'terms_hire.html'
        file_path = os.path.join(orchestrator.data_dir, file_name)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write("Updated hire content")

        orchestrator.process_file(file_name)

        assert TermsAndConditions.objects.count() == 1
        terms = TermsAndConditions.objects.first()
        assert terms.content == "Updated hire content"

    def test_process_file_handles_invalid_filename(self, orchestrator):
        """
        GIVEN a filename that doesn't match the terms_{type}.html pattern
        WHEN process_file is called directly
        THEN no record is created and no error is raised.
        """
        orchestrator.process_file('terms_invalid_type.html')
        assert TermsAndConditions.objects.count() == 0

    def test_run_ignores_old_versioned_files(self, orchestrator):
        """
        GIVEN a legacy terms_v2.html file in the data dir
        WHEN run() is called
        THEN the file is ignored and no records are created.
        """
        terms_file = os.path.join(orchestrator.data_dir, 'terms_v2.html')
        with open(terms_file, 'w') as f:
            f.write("<h1>Old Terms</h1>")

        orchestrator.run()

        assert TermsAndConditions.objects.count() == 0
