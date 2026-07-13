import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from service.models import ServiceSettings
from service.tests.factories import ServiceSettingsFactory
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
class TestServiceSettingsViewSet:
    def test_retrieve_settings_admin(self, admin_client):
        """
        GIVEN service settings exist
        WHEN an admin retrieves them
        THEN the response should be 200 OK and contain the settings.
        """
        ServiceSettingsFactory()
        # The URL for the singleton is typically the detail view with its known pk
        url = reverse('service_api:service-settings-admin')
        response = admin_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert 'booking_advance_notice' in response.data

    def test_retrieve_settings_unauthenticated(self, api_client):
        """
        GIVEN service settings exist
        WHEN an unauthenticated user tries to retrieve them
        THEN the response should be 401 Unauthorized.
        """
        url = reverse('service_api:service-settings-admin')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_retrieve_settings_regular_user(self, regular_client):
        """
        GIVEN service settings exist
        WHEN a regular user tries to retrieve them
        THEN the response should be 403 Forbidden.
        """
        url = reverse('service_api:service-settings-admin')
        response = regular_client.get(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_update_settings_admin(self, admin_client):
        """
        GIVEN service settings exist
        WHEN an admin updates them
        THEN the response should be 200 OK and the settings updated.
        """
        settings = ServiceSettingsFactory(booking_advance_notice=2)
        url = reverse('service_api:service-settings-admin')
        data = {'booking_advance_notice': 5}
        response = admin_client.patch(url, data)
        
        assert response.status_code == status.HTTP_200_OK
        settings.refresh_from_db()
        assert settings.booking_advance_notice == 5
        
            # def test_list_action_not_allowed(self, admin_client):
        #     """
        #     GIVEN the ServiceSettingsViewSet
        #     WHEN an admin tries to list all settings objects
        #     THEN the response should be 405 Method Not Allowed.
        #     """
        #     # This ViewSet does not have a 'list' action and is not routed,
        #     # so there is no URL to reverse.
        #     url = reverse('service-admin-settings-list')
        #     response = admin_client.get(url)
        #     assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
