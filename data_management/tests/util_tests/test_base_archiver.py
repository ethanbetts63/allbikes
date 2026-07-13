import os
import shutil
import pytest
from unittest.mock import MagicMock
from data_management.utils.archive_db.base_archiver import BaseArchiver

class TestBaseArchiver:

    @pytest.fixture
    def mock_command(self):
        command = MagicMock()
        command.style.SUCCESS = lambda x: x
        return command

    @pytest.fixture
    def base_archiver(self, mock_command):
        return BaseArchiver(mock_command)

    def test_init_sets_attributes(self, base_archiver, mock_command):
        assert base_archiver.command == mock_command
        assert hasattr(base_archiver, 'date_stamp')
        assert hasattr(base_archiver, 'base_output_dir')
        assert hasattr(base_archiver, 'archive_dir')

    def test_ensure_directory_exists_creates_dir(self, base_archiver, tmp_path):
        # Override base_output_dir to use tmp_path
        base_archiver.base_output_dir = str(tmp_path)
        base_archiver.archive_dir = os.path.join(str(tmp_path), base_archiver.date_stamp)
        
        base_archiver._ensure_directory_exists()
        
        assert os.path.exists(base_archiver.archive_dir)
        base_archiver.command.stdout.write.assert_called()

    def test_ensure_directory_exists_removes_existing(self, base_archiver, tmp_path):
        base_archiver.base_output_dir = str(tmp_path)
        base_archiver.archive_dir = os.path.join(str(tmp_path), base_archiver.date_stamp)
        
        # Create a file in the directory to check if it gets removed
        os.makedirs(base_archiver.archive_dir)
        test_file = os.path.join(base_archiver.archive_dir, 'test.txt')
        with open(test_file, 'w') as f:
            f.write('content')
            
        base_archiver._ensure_directory_exists()
        
        assert os.path.exists(base_archiver.archive_dir)
        assert not os.path.exists(test_file)

    def test_archive_raises_not_implemented(self, base_archiver):
        with pytest.raises(NotImplementedError):
            base_archiver.archive()

    def test_run_calls_methods(self, base_archiver):
        base_archiver._ensure_directory_exists = MagicMock()
        base_archiver.archive = MagicMock()
        
        base_archiver.run()
        
        base_archiver._ensure_directory_exists.assert_called_once()
        base_archiver.archive.assert_called_once()
