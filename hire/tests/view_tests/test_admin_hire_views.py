import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from data_management.tests.factories.user_factory import UserFactory
from hire.models import HireBooking
from hire.tests.factories.hire_settings_factory import HireSettingsFactory
from hire.tests.factories.hire_booking_factory import HireBookingFactory


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def admin_client(api_client):
    user = UserFactory(is_staff=True, is_superuser=True)
    api_client.force_authenticate(user=user)
    return api_client


# ---------------------------------------------------------------------------
# Admin Hire Settings
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestAdminHireSettingsView:

    def test_anonymous_returns_401(self, api_client):
        """
        GIVEN an unauthenticated request
        WHEN GET /api/hire/admin/settings/
        THEN 401 is returned.
        """
        url = reverse('hire:admin-hire-settings')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_non_staff_returns_403(self, api_client):
        """
        GIVEN a non-staff authenticated user
        WHEN GET /api/hire/admin/settings/
        THEN 403 is returned.
        """
        user = UserFactory(is_staff=False)
        api_client.force_authenticate(user=user)
        url = reverse('hire:admin-hire-settings')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_can_retrieve_settings(self, admin_client):
        """
        GIVEN existing HireSettings
        WHEN admin GET /api/hire/admin/settings/
        THEN 200 is returned with bond_amount, advance_min_days, advance_max_days.
        """
        HireSettingsFactory(bond_amount='250.00', advance_min_days=2)
        url = reverse('hire:admin-hire-settings')
        response = admin_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['bond_amount'] == '250.00'
        assert response.data['advance_min_days'] == 2

    def test_admin_can_patch_settings(self, admin_client):
        """
        GIVEN existing HireSettings
        WHEN admin PATCH with new bond_amount
        THEN 200 is returned and the value is updated.
        """
        HireSettingsFactory(bond_amount='100.00')
        url = reverse('hire:admin-hire-settings')
        response = admin_client.patch(url, {'bond_amount': '750.00'}, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['bond_amount'] == '750.00'


# ---------------------------------------------------------------------------
# Admin Hire Booking List
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestAdminHireBookingListView:

    def test_anonymous_returns_401(self, api_client):
        """
        GIVEN an unauthenticated request
        WHEN GET /api/hire/admin/bookings/
        THEN 401 is returned.
        """
        url = reverse('hire:admin-hire-booking-list')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_admin_can_list_all_bookings(self, admin_client):
        """
        GIVEN 3 hire bookings
        WHEN admin GET /api/hire/admin/bookings/
        THEN all 3 are returned.
        """
        HireBookingFactory.create_batch(3)
        url = reverse('hire:admin-hire-booking-list')
        response = admin_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 3

    def test_admin_can_filter_bookings_by_status(self, admin_client):
        """
        GIVEN 2 confirmed and 1 cancelled booking
        WHEN admin filters by status=confirmed
        THEN only 2 are returned.
        """
        HireBookingFactory.create_batch(2, status='confirmed')
        HireBookingFactory(status='cancelled')
        url = reverse('hire:admin-hire-booking-list')
        response = admin_client.get(url, {'status': 'confirmed'})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 2

    def test_admin_can_filter_by_multiple_statuses(self, admin_client):
        """
        GIVEN confirmed, active, and returned bookings
        WHEN admin filters by status=confirmed,active
        THEN only 2 are returned.
        """
        HireBookingFactory(status='confirmed')
        HireBookingFactory(status='active')
        HireBookingFactory(status='returned')
        url = reverse('hire:admin-hire-booking-list')
        response = admin_client.get(url, {'status': 'confirmed,active'})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 2


# ---------------------------------------------------------------------------
# Admin Hire Booking Detail
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestAdminHireBookingDetailView:

    def test_admin_can_retrieve_booking(self, admin_client):
        """
        GIVEN a hire booking
        WHEN admin GET /api/hire/admin/bookings/<pk>/
        THEN 200 and the booking data are returned.
        """
        booking = HireBookingFactory()
        url = reverse('hire:admin-hire-booking-detail', kwargs={'pk': booking.pk})
        response = admin_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['booking_reference'] == booking.booking_reference

    def test_returns_404_for_unknown_booking(self, admin_client):
        """
        GIVEN no booking with pk=9999
        WHEN admin GET /api/hire/admin/bookings/9999/
        THEN 404 is returned.
        """
        url = reverse('hire:admin-hire-booking-detail', kwargs={'pk': 9999})
        response = admin_client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_admin_can_delete_booking(self, admin_client):
        """
        GIVEN an existing hire booking
        WHEN admin DELETE /api/hire/admin/bookings/<pk>/
        THEN 204 is returned and the booking no longer exists.
        """
        booking = HireBookingFactory()
        url = reverse('hire:admin-hire-booking-detail', kwargs={'pk': booking.pk})
        response = admin_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not HireBooking.objects.filter(pk=booking.pk).exists()

    def test_delete_returns_404_for_unknown_booking(self, admin_client):
        """
        GIVEN no booking with pk=9999
        WHEN admin DELETE /api/hire/admin/bookings/9999/
        THEN 404 is returned.
        """
        url = reverse('hire:admin-hire-booking-detail', kwargs={'pk': 9999})
        response = admin_client.delete(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_anonymous_cannot_delete_booking(self, api_client):
        """
        GIVEN an unauthenticated request
        WHEN DELETE /api/hire/admin/bookings/<pk>/
        THEN 401 is returned and the booking is not deleted.
        """
        booking = HireBookingFactory()
        url = reverse('hire:admin-hire-booking-detail', kwargs={'pk': booking.pk})
        response = api_client.delete(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert HireBooking.objects.filter(pk=booking.pk).exists()


# ---------------------------------------------------------------------------
# Admin Hire Booking Status Update
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestAdminHireBookingStatusView:

    def test_admin_can_update_status(self, admin_client):
        """
        GIVEN a confirmed booking
        WHEN admin PATCH status to 'active'
        THEN 200 is returned and status is updated.
        """
        booking = HireBookingFactory(status='confirmed')
        url = reverse('hire:admin-hire-booking-status', kwargs={'pk': booking.pk})
        response = admin_client.patch(url, {'status': 'active'}, format='json')
        assert response.status_code == status.HTTP_200_OK
        booking.refresh_from_db()
        assert booking.status == 'active'

    def test_admin_can_update_notes(self, admin_client):
        """
        GIVEN a booking with no notes
        WHEN admin PATCH with notes
        THEN notes are saved.
        """
        booking = HireBookingFactory(notes='')
        url = reverse('hire:admin-hire-booking-status', kwargs={'pk': booking.pk})
        admin_client.patch(url, {'notes': 'Customer called to confirm.'}, format='json')
        booking.refresh_from_db()
        assert booking.notes == 'Customer called to confirm.'

    def test_returns_404_for_unknown_booking(self, admin_client):
        """
        GIVEN no booking with pk=9999
        WHEN admin PATCH status for pk=9999
        THEN 404 is returned.
        """
        url = reverse('hire:admin-hire-booking-status', kwargs={'pk': 9999})
        response = admin_client.patch(url, {'status': 'active'}, format='json')
        assert response.status_code == status.HTTP_404_NOT_FOUND
