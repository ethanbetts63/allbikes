import pytest
from unittest.mock import MagicMock, patch
from data_management.utils.archive_db.model_lister import ModelLister

class TestModelLister:

    @patch('data_management.utils.archive_db.model_lister.apps')
    def test_get_all_models_includes_all_if_no_exclude(self, mock_apps):
        # Setup mock app configs and models
        config1 = MagicMock()
        config1.label = 'app1'
        config1.get_models.return_value = ['model1_a', 'model1_b']
        
        config2 = MagicMock()
        config2.label = 'app2'
        config2.get_models.return_value = ['model2_a']
        
        mock_apps.get_app_configs.return_value = [config1, config2]
        
        lister = ModelLister()
        models = lister.get_all_models()
        
        assert len(models) == 3
        assert 'model1_a' in models
        assert 'model1_b' in models
        assert 'model2_a' in models

    @patch('data_management.utils.archive_db.model_lister.apps')
    def test_get_all_models_excludes_apps(self, mock_apps):
        config1 = MagicMock()
        config1.label = 'app1'
        config1.get_models.return_value = ['model1_a']
        
        config2 = MagicMock()
        config2.label = 'app2'
        config2.get_models.return_value = ['model2_a']
        
        mock_apps.get_app_configs.return_value = [config1, config2]
        
        lister = ModelLister(app_labels_to_exclude=['app1'])
        models = lister.get_all_models()
        
        assert len(models) == 1
        assert 'model2_a' in models
        assert 'model1_a' not in models

    @patch('data_management.utils.archive_db.model_lister.apps')
    def test_get_all_models_handles_empty_models(self, mock_apps):
        config1 = MagicMock()
        config1.label = 'app1'
        config1.get_models.return_value = []
        
        mock_apps.get_app_configs.return_value = [config1]
        
        lister = ModelLister()
        models = lister.get_all_models()
        
        assert len(models) == 0
