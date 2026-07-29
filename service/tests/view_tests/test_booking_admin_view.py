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
            'state': 'WA',
            'postcode': '6059',
        }
        response = admin_client.post('/api/service/admin/bookings/', payload, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        booking = Booking.objects.get(pk=response.data['id'])
        assert booking.source == Booking.Source.MANUAL
        assert booking.make == 'Honda'
        assert booking.model == 'CB125'
        assert booking.suburb == 'Dianella'
        assert booking.state == 'WA'
        # Model default status applies when not supplied.
        assert booking.status == Booking.Status.ACCEPTED

    def test_manual_create_rejects_postcode_from_another_state(self, admin_client):
        response = admin_client.post('/api/service/admin/bookings/', {
            'drop_off_date': '2026-01-10',
            'customer_name': 'Walk In',
            'state': 'WA',
            'postcode': '2000',
        }, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'postcode' in response.data

    def test_manual_create_allows_address_to_be_omitted(self, admin_client):
        response = admin_client.post('/api/service/admin/bookings/', {
            'drop_off_date': '2026-01-10',
            'customer_name': 'Walk In',
        }, format='json')

        assert response.status_code == status.HTTP_201_CREATED

    def test_update_status(self, admin_client):
        booking = BookingFactory(status=Booking.Status.ACCEPTED)
        response = admin_client.patch(
            f'/api/service/admin/bookings/{booking.id}/',
            {'status': 'finished'},
            format='json',
        )
        assert response.status_code == status.HTTP_200_OK
        booking.refresh_from_db()
        assert booking.status == Booking.Status.FINISHED

    def test_unrelated_update_allows_legacy_postcode_without_state(self, admin_client):
        booking = BookingFactory(state='', postcode='6059', status=Booking.Status.ACCEPTED)

        response = admin_client.patch(
            f'/api/service/admin/bookings/{booking.id}/',
            {'status': 'finished'},
            format='json',
        )

        assert response.status_code == status.HTTP_200_OK

    def test_delete(self, admin_client):
        booking = BookingFactory()
        response = admin_client.delete(f'/api/service/admin/bookings/{booking.id}/')
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Booking.objects.filter(pk=booking.id).exists()

    def test_search_matches_across_fields_and_ignores_date_window(self, admin_client):
        target = BookingFactory(
            customer_name='Priya Nair', registration='9XYZ887',
            drop_off_date=date(2020, 1, 1),  # far outside any week window
        )
        BookingFactory(customer_name='Someone Else', registration='1AAA111')

        # Match by name
        r1 = admin_client.get('/api/service/admin/bookings/?search=priya')
        assert r1.status_code == status.HTTP_200_OK
        assert [b['id'] for b in r1.data] == [target.id]

        # Match by registration, case-insensitive, even with a date window set
        r2 = admin_client.get('/api/service/admin/bookings/?search=9xyz&start=2026-01-01&end=2026-01-07')
        assert [b['id'] for b in r2.data] == [target.id]

    def test_search_no_matches_returns_empty(self, admin_client):
        BookingFactory(customer_name='Priya Nair')
        response = admin_client.get('/api/service/admin/bookings/?search=zzzznomatch')
        assert response.status_code == status.HTTP_200_OK
        assert response.data == []
