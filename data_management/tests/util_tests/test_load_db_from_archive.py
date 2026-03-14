import os
import shutil
import pytest
from unittest.mock import MagicMock, patch, call
from data_management.utils.archive_db.load_db_from_archive import load_db_from_latest_archive

class TestLoadDbFromArchive:

    @pytest.fixture
    def mock_command(self):
        command = MagicMock()
        command.style.SUCCESS = lambda x: x
        command.style.ERROR = lambda x: x
        command.style.WARNING = lambda x: x
        return command

    @pytest.fixture
    def setup_archive_dirs(self, tmp_path):
        base_dir = tmp_path / 'data_management' / 'data' / 'archive' / 'db_backups'
        os.makedirs(base_dir, exist_ok=True)
        
        # Create a couple of archive directories
        (base_dir / '2023-01-01').mkdir()
        (base_dir / '2023-01-02').mkdir()
        
        return base_dir

    @patch('data_management.utils.archive_db.load_db_from_archive.subprocess.run')
    def test_load_db_finds_latest_and_loads(self, mock_run, mock_command, setup_archive_dirs):
        # Create a file in the latest archive
        latest_archive = setup_archive_dirs / '2023-01-02'
        test_file = latest_archive / 'data_management.brand.json'
        test_file.touch()

        # Patch os.path.join to return our temp path when looking for base_archive_dir
        # But we need to be careful as os.path.join is used inside the function for other things too.
        # Instead, let's patch the hardcoded path inside the function or just rely on the fact 
        # that we can't easily change the hardcoded path without refactoring.
        # 
        # Wait, the function has hardcoded `os.path.join('data_management', 'data', 'archive', 'db_backups')`
        # This is relative to CWD. So I can just create this structure in the test environment if I chdir?
        # Or I can patch `os.path.join` specifically for that call? Too risky.
        # Better: Patch `os.path.exists` and `os.listdir` to simulate the structure?
        
        # Let's try mocking os.path.exists and os.listdir.
        
        with patch('os.path.exists') as mock_exists, \
             patch('os.listdir') as mock_listdir:
            
            # Setup mocks
            def side_effect_exists(path):
                if 'db_backups' in path and '2023' not in path: # base dir check
                    return True
                if '2023-01-02' in path and 'data_management.brand.json' in path: # file check
                    return True
                return False

            mock_exists.side_effect = side_effect_exists
            mock_listdir.return_value = ['2023-01-01', '2023-01-02']
            
            # We also need to mock isdir inside list comprehension
            with patch('os.path.isdir', return_value=True):
                load_db_from_latest_archive(mock_command)
        
        # Verify flush called
        assert mock_run.call_count >= 1
        args, _ = mock_run.call_args_list[0]
        assert 'flush' in args[0]
        
        # Verify loaddata called for the file we said exists
        # We expect at least 2 calls (flush + 1 loaddata)
        assert mock_run.call_count >= 2
        
        # Check if loaddata was called for brand.json
        found = False
        for call_args in mock_run.call_args_list:
            cmd = call_args[0][0]
            if 'loaddata' in cmd and any('data_management.brand.json' in arg for arg in cmd):
                found = True
                break
        assert found

    def test_load_db_missing_base_dir(self, mock_command):
        with patch('os.path.exists', return_value=False):
            load_db_from_latest_archive(mock_command)
        
        mock_command.stderr.write.assert_called()
        assert "Archive directory not found" in mock_command.stderr.write.call_args[0][0]

    def test_load_db_no_archives(self, mock_command):
        with patch('os.path.exists', return_value=True), \
             patch('os.listdir', return_value=[]):
            load_db_from_latest_archive(mock_command)
            
        mock_command.stderr.write.assert_called()
        assert "No archive directories found" in mock_command.stderr.write.call_args[0][0]
