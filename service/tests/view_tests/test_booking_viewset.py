import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from unittest.mock import patch
from service.tests.factories import ServiceSettingsFactory, JobTypeFactory

@pytest.fixture
def api_client():
    return APIClient()

@pytest.mark.django_db
class TestBookingViewSet:
    @patch('service.views.booking_viewset.MechanicsDeskService')
    def test_create_booking_success(self, mock_mechanics_desk_service, api_client):
        """
        GIVEN valid booking data
        WHEN a POST request is made to the create booking endpoint
        THEN a booking should be created successfully via the external service.
        """
        # Mock the external service's methods
        mock_service_instance = mock_mechanics_desk_service.return_value
        mock_service_instance.create_booking.return_value = {'status': 'success'}

        url = reverse('service_api:create-booking')
        data = {
            "first_name": "Test", "last_name": "User", "phone": "123456", "email": "test@example.com",
            "registration_number": "TEST1", "make": "Honda", "model": "CBR",
            "drop_off_time": "25/12/2025 10:00", "job_type_names": ["Annual Service"]
        }
        
        response = api_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        mock_service_instance.create_booking.assert_called_once()
    
    @patch('service.views.booking_viewset.MechanicsDeskService')
    def test_create_booking_failure(self, mock_mechanics_desk_service, api_client):
        """
        GIVEN the external service returns an error
        WHEN a POST request is made to create a booking
        THEN the response should indicate a failure.
        """
        mock_service_instance = mock_mechanics_desk_service.return_value
        mock_service_instance.create_booking.return_value = {'error': 'External service unavailable'}

        url = reverse('service_api:create-booking')
        data = {
            "first_name": "Test", "last_name": "User", "phone": "123456", "email": "test@example.com",
            "registration_number": "TEST1", "make": "Honda", "model": "CBR",
            "drop_off_time": "25/12/2025 10:00", "job_type_names": ["Annual Service"]
        }

        response = api_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert 'error' in response.data

    def test_fetch_service_config(self, api_client):
        """
        GIVEN service settings exist
        WHEN a GET request is made to fetch the service config
        THEN the settings should be returned.
        """
        ServiceSettingsFactory()
        url = reverse('service_api:get-settings')
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert 'booking_advance_notice' in response.data

    @patch('service.views.booking_viewset.MechanicsDeskService')
    def test_job_types_enrichment(self, mock_mechanics_desk_service, api_client):
        """
        GIVEN job types from the external service and local descriptions
        WHEN the job_types endpoint is called
        THEN the response should contain an enriched list of job types.
        """
        # Data from external service
        mock_service_instance = mock_mechanics_desk_service.return_value
        mock_service_instance.get_job_types.return_value = ["General Service", "Tire Change"]
        
        # Local data
        JobTypeFactory(name="General Service", description="A thorough check-up.")

        url = reverse('service_api:job-types')
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2
        
        general_service = next(item for item in response.data if item['name'] == "General Service")
        tire_change = next(item for item in response.data if item['name'] == "Tire Change")

        assert general_service['description'] == "A thorough check-up."
        assert tire_change['description'] is None

    @patch('service.views.booking_viewset.MechanicsDeskService')
    def test_unavailable_days(self, mock_mechanics_desk_service, api_client):
        """
        GIVEN a list of unavailable days from the external service
        WHEN the unavailable_days endpoint is called
        THEN the list should be returned successfully.
        """
        mock_service_instance = mock_mechanics_desk_service.return_value
        mock_service_instance.get_unavailable_days.return_value = ["2025-12-25", "2026-01-01"]
        
        url = reverse('service_api:unavailable-days')
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data == ["2025-12-25", "2026-01-01"]
        mock_service_instance.get_unavailable_days.assert_called_once_with(in_days=30)
