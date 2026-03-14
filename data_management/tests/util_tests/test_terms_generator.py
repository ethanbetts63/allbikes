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
            # Create the directory structure expected by the orchestrator
            data_dir = tmp_path / 'data_management' / 'data'
            os.makedirs(data_dir, exist_ok=True)
            
            orchestrator = TermsUpdateOrchestrator(mock_command)
            # Ensure data_dir points to our temp dir
            orchestrator.data_dir = str(data_dir)
            
            return orchestrator

    def test_run_finds_and_processes_files(self, orchestrator):
        # Create a dummy terms file
        terms_file = os.path.join(orchestrator.data_dir, 'terms_v1.0.html')
        with open(terms_file, 'w') as f:
            f.write("<h1>Terms v1.0</h1>")

        orchestrator.process_file = MagicMock()
        
        orchestrator.run()
        
        orchestrator.process_file.assert_called_with('terms_v1.0.html')
        orchestrator.command.stdout.write.assert_called()

    def test_run_handles_no_files(self, orchestrator):
        orchestrator.run()
        
        # Check for warning
        args_list = orchestrator.command.stdout.write.call_args_list
        # The exact message might be wrapped in style.WARNING
        # We can check if "No 'terms_v*.html' files found." was passed to one of the calls
        found = False
        for call_args in args_list:
            if "No 'terms_v*.html' files found." in str(call_args):
                found = True
                break
        assert found

    def test_process_file_creates_terms(self, orchestrator):
        # Create a dummy terms file
        file_name = 'terms_v2.5.html'
        file_path = os.path.join(orchestrator.data_dir, file_name)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write("<h1>Terms v2.5 Content</h1>")

        orchestrator.process_file(file_name)

        assert TermsAndConditions.objects.count() == 1
        terms = TermsAndConditions.objects.first()
        assert terms.version == '2.5'
        assert terms.content == "<h1>Terms v2.5 Content</h1>"

    def test_process_file_skips_existing_version(self, orchestrator):
        # Create existing terms
        TermsAndConditions.objects.create(version='3.0', content='Old content')

        # Create file for same version
        file_name = 'terms_v3.0.html'
        file_path = os.path.join(orchestrator.data_dir, file_name)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write("New content")

        orchestrator.process_file(file_name)

        # Should still be 1, and content unchanged
        assert TermsAndConditions.objects.count() == 1
        terms = TermsAndConditions.objects.first()
        assert terms.content == 'Old content'
        
        # Check notice log
        found = False
        for call_args in orchestrator.command.stdout.write.call_args_list:
            if "Version 3.0 already exists" in str(call_args):
                found = True
                break
        assert found

    def test_process_file_handles_invalid_filename(self, orchestrator):
        file_name = 'terms_invalid.html'
        # Orchestrator checks regex for listdir, but process_file also has regex check
        # We can call process_file directly with invalid name
        
        orchestrator.process_file(file_name)
        
        assert TermsAndConditions.objects.count() == 0
        
        # Check error log
        found = False
        for call_args in orchestrator.command.stdout.write.call_args_list:
            if f"Could not extract version from {file_name}" in str(call_args):
                found = True
                break
        assert found
