import pytest
from datetime import time
from service.serializers import ServiceSettingsSerializer
from service.tests.factories import ServiceSettingsFactory

@pytest.mark.django_db
class TestServiceSettingsSerializer:
    def test_service_settings_serialization(self):
        """
        GIVEN a ServiceSettings instance
        WHEN it is serialized
        THEN the serialized data should match the model instance.
        """
        settings = ServiceSettingsFactory(
            booking_advance_notice=3,
            drop_off_start_time=time(8, 30),
            drop_off_end_time=time(18, 0)
        )
        serializer = ServiceSettingsSerializer(instance=settings)
        data = serializer.data
        
        assert data['id'] == settings.id
        assert data['booking_advance_notice'] == 3
        assert data['drop_off_start_time'] == '08:30:00'
        assert data['drop_off_end_time'] == '18:00:00'
