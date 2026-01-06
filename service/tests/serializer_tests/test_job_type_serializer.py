import pytest
from service.serializers import JobTypeSerializer
from service.tests.factories import JobTypeFactory

@pytest.mark.django_db
class TestJobTypeSerializer:
    def test_job_type_serialization(self):
        """
        GIVEN a JobType instance
        WHEN it is serialized
        THEN the serialized data should match the model instance.
        """
        job_type = JobTypeFactory(name="Annual Service", description="Full checkup.")
        serializer = JobTypeSerializer(instance=job_type)
        data = serializer.data
        
        assert data['id'] == job_type.id
        assert data['name'] == "Annual Service"
        assert data['description'] == "Full checkup."
