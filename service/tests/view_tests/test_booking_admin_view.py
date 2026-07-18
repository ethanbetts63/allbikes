import pytest
from datetime import date
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APIClient
from service.models import Booking
from service.tests.factories import BookingFactory


@pytest.fixture
def admin_user():
    return User.objects.create_superuser('admin', 'admin@example.com', 'password')


@pytest.fixture
def regular_user():
    return User.objects.create_user('user', 'user@example.com', 'password')


@pytest.fixture
def admin_client(admin_user):
    client = APIClient()
    client.force_authenticate(user=admin_user)
    return client


@pytest.mark.django_db
class TestBookingAdminViewSet:
    def test_requires_admin(self, regular_user):
        client = APIClient()
        client.force_authenticate(user=regular_user)
        response = client.get('/api/service/admin/bookings/')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_list_filters_by_week_window(self, admin_client):
        in_window = BookingFactory(drop_off_date=date(2026, 1, 7))
        BookingFactory(drop_off_date=date(2026, 2, 1))  # outside

        response = admin_client.get('/api/service/admin/bookings/?start=2026-01-05&end=2026-01-11')
        assert response.status_code == status.HTTP_200_OK
        ids = [b['id'] for b in response.data]
        assert ids == [in_window.id]

    def test_manual_create_defaults_to_manual_source(self, admin_client):
        payload = {
            'drop_off_date': '2026-01-10',
            'drop_off_time': '09:30:00',
            'customer_name': 'Walk In',
            'make': 'Honda',
            'model': 'CB125',
            'street_address': '1 Test St',
            'suburb': 'Dianella',
            'postcode': '6059',
        }
        response = admin_client.post('/api/service/admin/bookings/', payload, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        booking = Booking.objects.get(pk=response.data['id'])
        assert booking.source == Booking.Source.MANUAL
        assert booking.make == 'Honda'
        assert booking.model == 'CB125'
        assert booking.suburb == 'Dianella'
        # Model default status applies when not supplied.
        assert booking.status == Booking.Status.NOT_STARTED

    def test_update_status(self, admin_client):
        booking = BookingFactory(status=Booking.Status.NOT_STARTED)
        response = admin_client.patch(
            f'/api/service/admin/bookings/{booking.id}/',
            {'status': 'finished_paid'},
            format='json',
        )
        assert response.status_code == status.HTTP_200_OK
        booking.refresh_from_db()
        assert booking.status == Booking.Status.FINISHED_PAID

    def test_delete(self, admin_client):
        booking = BookingFactory()
        response = admin_client.delete(f'/api/service/admin/bookings/{booking.id}/')
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Booking.objects.filter(pk=booking.id).exists()
