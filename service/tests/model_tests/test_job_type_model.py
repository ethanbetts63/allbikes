import pytest
from django.db.utils import IntegrityError
from service.models import JobType
from service.tests.factories.job_type_factory import JobTypeFactory

@pytest.mark.django_db
class TestJobTypeModel:
    def test_job_type_creation(self):
        """
        GIVEN a JobType instance
        WHEN it is created
        THEN all fields should be saved correctly.
        """
        job_type = JobTypeFactory(name="Test Service", description="A test description.")
        assert job_type.pk is not None
        assert job_type.name == "Test Service"
        assert job_type.description == "A test description."
        assert str(job_type) == "Test Service"

    def test_job_type_name_uniqueness(self):
        """
        GIVEN an existing JobType
        WHEN another JobType with the same name is created
        THEN an IntegrityError should be raised.
        """
        JobTypeFactory(name="Unique Name")
        with pytest.raises(IntegrityError):
            JobType.objects.create(name="Unique Name")
