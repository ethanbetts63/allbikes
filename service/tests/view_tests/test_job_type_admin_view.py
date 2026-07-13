import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from service.models import JobType
from service.tests.factories import JobTypeFactory
from data_management.tests.factories.user_factory import UserFactory

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def admin_user():
    return UserFactory(is_staff=True, is_superuser=True)

@pytest.fixture
def regular_user():
    return UserFactory()

@pytest.fixture
def admin_client(admin_user):
    client = APIClient()
    client.force_authenticate(user=admin_user)
    return client
    
@pytest.fixture
def regular_client(regular_user):
    client = APIClient()
    client.force_authenticate(user=regular_user)
    return client

@pytest.mark.django_db
class TestJobTypeAdminViewSet:
    def test_list_job_types_admin(self, admin_client):
        """
        GIVEN job types exist
        WHEN an admin lists them
        THEN the response should be 200 OK and contain the job types.
        """
        JobTypeFactory.create_batch(2)
        url = reverse('service_api:job-type-admin-list')
        response = admin_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2

    def test_list_job_types_unauthenticated(self, api_client):
        """
        GIVEN job types exist
        WHEN an unauthenticated user tries to list them
        THEN the response should be 401 Unauthorized.
        """
        url = reverse('service_api:job-type-admin-list')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_list_job_types_regular_user(self, regular_client):
        """
        GIVEN job types exist
        WHEN a regular user tries to list them
        THEN the response should be 403 Forbidden.
        """
        url = reverse('service_api:job-type-admin-list')
        response = regular_client.get(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_create_job_type_admin(self, admin_client):
        """
        GIVEN valid data for a new job type
        WHEN an admin creates it
        THEN the response should be 201 Created.
        """
        url = reverse('service_api:job-type-admin-list')
        data = {'name': 'New Service', 'description': 'A new service description.'}
        response = admin_client.post(url, data)
        
        assert response.status_code == status.HTTP_201_CREATED
        assert JobType.objects.filter(name='New Service').exists()

    def test_update_job_type_admin(self, admin_client):
        """
        GIVEN a job type exists
        WHEN an admin updates it
        THEN the response should be 200 OK and the data updated.
        """
        job_type = JobTypeFactory()
        url = reverse('service_api:job-type-admin-detail', kwargs={'pk': job_type.pk})
        data = {'name': 'Updated Name'}
        response = admin_client.patch(url, data)
        
        assert response.status_code == status.HTTP_200_OK
        job_type.refresh_from_db()
        assert job_type.name == 'Updated Name'

    def test_delete_job_type_admin(self, admin_client):
        """
        GIVEN a job type exists
        WHEN an admin deletes it
        THEN the response should be 204 No Content.
        """
        job_type = JobTypeFactory()
        url = reverse('service_api:job-type-admin-detail', kwargs={'pk': job_type.pk})
        response = admin_client.delete(url)
        
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not JobType.objects.filter(pk=job_type.pk).exists()
