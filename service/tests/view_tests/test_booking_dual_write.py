import pytest
from datetime import date, time
from unittest.mock import patch
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from service.models import Booking


@pytest.fixture
def api_client():
    return APIClient()


BASE_PAYLOAD = {
    "first_name": "Test", "last_name": "User", "phone": "123456", "email": "test@example.com",
    "registration_number": "TEST1", "make": "Honda", "model": "CBR",
    "drop_off_time": "25/12/2026 10:00", "job_type_names": ["Annual Service"],
    "terms_accepted": True,
}


@pytest.mark.django_db
class TestBookingDualWrite:
    @patch('service.views.booking_viewset.send_admin_service_booking')
    @patch('service.views.booking_viewset.send_service_booking_confirmation')
    @patch('service.views.booking_viewset.MechanicsDeskService')
    def test_local_booking_created_as_requested(self, mock_md, _c, _a, api_client):
        mock_md.return_value.create_booking.return_value = {'status': 'success'}

        response = api_client.post(reverse('service_api:create-booking'), BASE_PAYLOAD, format='json')
        assert response.status_code == status.HTTP_201_CREATED

        assert Booking.objects.count() == 1
        booking = Booking.objects.first()
        assert booking.status == Booking.Status.REQUESTED
        assert booking.source == Booking.Source.WEBSITE
        assert booking.drop_off_date == date(2026, 12, 25)
        assert booking.drop_off_time == time(10, 0)
        assert booking.bike_name == "Honda CBR"
        assert booking.registration == "TEST1"
        assert booking.booking_log is not None

    @patch('service.views.booking_viewset.send_admin_service_booking')
    @patch('service.views.booking_viewset.send_service_booking_confirmation')
    @patch('service.views.booking_viewset.MechanicsDeskService')
    def test_no_local_booking_on_md_failure(self, mock_md, _c, _a, api_client):
        mock_md.return_value.create_booking.return_value = {'error': 'unavailable'}

        response = api_client.post(reverse('service_api:create-booking'), BASE_PAYLOAD, format='json')
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert Booking.objects.count() == 0
