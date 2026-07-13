import os
import sys
import subprocess
import pytest
from unittest.mock import MagicMock, patch, call
from data_management.utils.archive_db.database_archiver import DatabaseArchiver

class TestDatabaseArchiver:

    @pytest.fixture
    def mock_command(self):
        command = MagicMock()
        command.style.SUCCESS = lambda x: x
        command.style.ERROR = lambda x: x
        return command

    @pytest.fixture
    def database_archiver(self, mock_command):
        # Patch BaseArchiver.__init__ to avoid file system operations during init if any
        # Actually BaseArchiver init is safe, but let's mock the ModelLister inside
        with patch('data_management.utils.archive_db.database_archiver.ModelLister') as MockModelLister:
            archiver = DatabaseArchiver(mock_command)
            archiver.model_lister = MockModelLister.return_value
            # Set a dummy archive dir
            archiver.archive_dir = "/tmp/archive"
            yield archiver

    def test_init_sets_up_model_lister(self, mock_command):
        with patch('data_management.utils.archive_db.database_archiver.ModelLister') as MockModelLister:
            archiver = DatabaseArchiver(mock_command)
            MockModelLister.assert_called_once()
            args, kwargs = MockModelLister.call_args
            assert 'admin' in kwargs['app_labels_to_exclude']

    @patch('subprocess.run')
    def test_archive_runs_dumpdata_for_models(self, mock_subprocess_run, database_archiver):
        # Setup mock models
        mock_model1 = MagicMock()
        mock_model1._meta.app_label = 'app1'
        mock_model1._meta.model_name = 'model1'
        
        mock_model2 = MagicMock()
        mock_model2._meta.app_label = 'app2'
        mock_model2._meta.model_name = 'model2'
        
        database_archiver.model_lister.get_all_models.return_value = [mock_model1, mock_model2]
        
        database_archiver.archive()
        
        assert mock_subprocess_run.call_count == 2
        
        # Verify first call
        first_call_args = mock_subprocess_run.call_args_list[0]
        command_list = first_call_args[0][0]
        assert 'manage.py' in command_list
        assert 'dumpdata' in command_list
        assert 'app1.model1' in command_list
        
        # Verify second call
        second_call_args = mock_subprocess_run.call_args_list[1]
        command_list = second_call_args[0][0]
        assert 'app2.model2' in command_list

    @patch('subprocess.run')
    def test_archive_handles_subprocess_error(self, mock_subprocess_run, database_archiver):
        mock_model = MagicMock()
        mock_model._meta.app_label = 'app1'
        mock_model._meta.model_name = 'model1'
        
        database_archiver.model_lister.get_all_models.return_value = [mock_model]
        
        mock_subprocess_run.side_effect = subprocess.CalledProcessError(1, 'cmd', stderr='error message')
        
        database_archiver.archive()
        
        database_archiver.command.stderr.write.assert_called()
        args, _ = database_archiver.command.stderr.write.call_args
        assert 'error message' in args[0]

    def test_archive_handles_no_models(self, database_archiver):
        database_archiver.model_lister.get_all_models.return_value = []
        with patch('builtins.print') as mock_print:
            database_archiver.archive()
            mock_print.assert_any_call("No models found to archive.")
