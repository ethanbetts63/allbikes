import pytest
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from service.models import BookingRequestLog
from service.tests.factories.booking_request_log_factory import BookingRequestLogFactory

# Create a factory if it doesn't exist?
# The list_directory earlier showed `service/tests/factories`, but I didn't check if `booking_request_log_factory` exists.
# I'll check first, otherwise I'll define a local factory or use `objects.create`.
# To be safe, I'll use `objects.create` directly in the test setup or create the factory.

@pytest.fixture
def admin_user():
    return User.objects.create_superuser('admin', 'admin@example.com', 'password')

@pytest.fixture
def regular_user():
    return User.objects.create_user('user', 'user@example.com', 'password')

@pytest.fixture
def booking_log():
    return BookingRequestLog.objects.create(
        customer_name="Test User",
        customer_email="test@example.com",
        vehicle_registration="TEST-123",
        request_payload={},
        response_status_code=200,
        response_body={},
        status="Success"
    )

@pytest.mark.django_db
class TestBookingRequestLogListView:
    
    def test_admin_can_list_logs(self, admin_user, booking_log):
        client = APIClient()
        client.force_authenticate(user=admin_user)
        response = client.get('/api/service/admin/booking-logs/')
        # Note: I need to verify the URL path.
        # Assuming the URL configuration maps to this view.
        # If I can't guess the URL, I might need to use `reverse` or check `service/urls.py`.
        # Let's check `service/urls.py` first to be sure.
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1

    def test_regular_user_cannot_list_logs(self, regular_user):
        client = APIClient()
        client.force_authenticate(user=regular_user)
        # Using a placeholder URL, will fix after checking urls.py
        response = client.get('/api/service/admin/booking-logs/') 
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_filtering_by_status(self, admin_user):
        BookingRequestLog.objects.create(
            customer_name="Success User",
            customer_email="s@e.com",
            vehicle_registration="A",
            request_payload={}, response_status_code=200, response_body={},
            status="Success"
        )
        BookingRequestLog.objects.create(
            customer_name="Fail User",
            customer_email="f@e.com",
            vehicle_registration="B",
            request_payload={}, response_status_code=400, response_body={},
            status="Failed"
        )
        
        client = APIClient()
        client.force_authenticate(user=admin_user)
        
        response = client.get('/api/service/admin/booking-logs/?status=Success')
        assert response.status_code == status.HTTP_200_OK
        assert all(r['status'] == 'Success' for r in response.data['results'])
        
        response = client.get('/api/service/admin/booking-logs/?status=Failed')
        assert response.status_code == status.HTTP_200_OK
        assert all(r['status'] == 'Failed' for r in response.data['results'])


@pytest.mark.django_db
class TestBookingRequestLogDetailView:
    
    def test_admin_can_retrieve_log(self, admin_user, booking_log):
        client = APIClient()
        client.force_authenticate(user=admin_user)
        response = client.get(f'/api/service/admin/booking-logs/{booking_log.id}/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['id'] == booking_log.id
        assert 'request_payload' in response.data

    def test_admin_can_delete_log(self, admin_user, booking_log):
        client = APIClient()
        client.force_authenticate(user=admin_user)
        response = client.delete(f'/api/service/admin/booking-logs/{booking_log.id}/')
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not BookingRequestLog.objects.filter(id=booking_log.id).exists()
