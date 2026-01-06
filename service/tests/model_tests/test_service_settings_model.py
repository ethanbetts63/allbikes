import pytest
from service.models import ServiceSettings
from service.tests.factories.service_settings_factory import ServiceSettingsFactory

@pytest.mark.django_db
class TestServiceSettingsModel:
    def test_singleton_creation(self):
        """
        GIVEN no ServiceSettings instance exists
        WHEN a new one is created
        THEN it should be saved successfully.
        """
        settings = ServiceSettingsFactory()
        assert settings.pk == 1
        assert ServiceSettings.objects.count() == 1

    def test_singleton_uniqueness(self):
        """
        GIVEN a ServiceSettings instance already exists
        WHEN another instance is attempted to be saved
        THEN a ValueError should be raised.
        """
        ServiceSettingsFactory()  # Create the first instance
        with pytest.raises(ValueError, match="There can be only one ServiceSettings instance"):
            # Attempt to save a new instance, not using the factory's get_or_create
            new_settings = ServiceSettings(pk=2)
            new_settings.save()

    def test_load_method(self):
        """
        GIVEN no ServiceSettings instance exists
        WHEN the load() method is called
        THEN a new instance should be created and returned.
        """
        assert ServiceSettings.objects.count() == 0
        settings = ServiceSettings.load()
        assert settings is not None
        assert isinstance(settings, ServiceSettings)
        assert ServiceSettings.objects.count() == 1

    def test_load_method_existing(self):
        """
        GIVEN a ServiceSettings instance already exists
        WHEN the load() method is called
        THEN the existing instance should be returned.
        """
        existing_settings = ServiceSettingsFactory(booking_advance_notice=5)
        assert ServiceSettings.objects.count() == 1
        
        loaded_settings = ServiceSettings.load()
        assert loaded_settings.pk == existing_settings.pk
        assert loaded_settings.booking_advance_notice == 5
        assert ServiceSettings.objects.count() == 1
        
    def test_string_representation(self):
        """
        GIVEN a ServiceSettings instance
        THEN its string representation should be 'Service Settings'.
        """
        settings = ServiceSettings.load()
        assert str(settings) == "Service Settings"
