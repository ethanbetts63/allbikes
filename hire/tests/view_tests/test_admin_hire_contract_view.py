import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from data_management.tests.factories.user_factory import UserFactory
from hire.tests.factories.hire_booking_factory import HireBookingFactory


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def admin_client(api_client):
    user = UserFactory(is_staff=True, is_superuser=True)
    api_client.force_authenticate(user=user)
    return api_client


def _url(pk):
    return reverse('hire:admin-hire-booking-contract', kwargs={'pk': pk})


@pytest.mark.django_db
class TestAdminHireBookingContractView:

    def test_anonymous_returns_401(self, api_client):
        """
        GIVEN an unauthenticated request
        WHEN GET /api/hire/admin/bookings/<pk>/contract/
        THEN 401 is returned.
        """
        booking = HireBookingFactory()
        response = api_client.get(_url(booking.pk))
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_non_staff_returns_403(self, api_client):
        """
        GIVEN a request authenticated as a non-staff user
        WHEN GET /api/hire/admin/bookings/<pk>/contract/
        THEN 403 is returned.
        """
        user = UserFactory(is_staff=False)
        api_client.force_authenticate(user=user)
        booking = HireBookingFactory()
        response = api_client.get(_url(booking.pk))
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_unknown_booking_returns_404(self, admin_client):
        """
        GIVEN an admin request for a booking ID that does not exist
        WHEN GET /api/hire/admin/bookings/<pk>/contract/
        THEN 404 is returned.
        """
        response = admin_client.get(_url(999999))
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_returns_200_for_valid_booking(self, admin_client):
        """
        GIVEN an admin request for an existing booking
        WHEN GET /api/hire/admin/bookings/<pk>/contract/
        THEN 200 is returned.
        """
        booking = HireBookingFactory()
        response = admin_client.get(_url(booking.pk))
        assert response.status_code == status.HTTP_200_OK

    def test_response_content_type_is_pdf(self, admin_client):
        """
        GIVEN an admin request for an existing booking
        WHEN GET /api/hire/admin/bookings/<pk>/contract/
        THEN the response Content-Type is application/pdf.
        """
        booking = HireBookingFactory()
        response = admin_client.get(_url(booking.pk))
        assert response['Content-Type'] == 'application/pdf'

    def test_content_disposition_is_attachment_with_booking_reference(self, admin_client):
        """
        GIVEN an admin request for an existing booking
        WHEN GET /api/hire/admin/bookings/<pk>/contract/
        THEN Content-Disposition is an attachment named after the booking reference.
        """
        booking = HireBookingFactory()
        response = admin_client.get(_url(booking.pk))
        disposition = response['Content-Disposition']
        assert 'attachment' in disposition
        assert f'{booking.booking_reference}_contract.pdf' in disposition

    def test_response_body_is_non_empty(self, admin_client):
        """
        GIVEN an admin request for an existing booking
        WHEN GET /api/hire/admin/bookings/<pk>/contract/
        THEN the response body contains PDF bytes.
        """
        booking = HireBookingFactory()
        response = admin_client.get(_url(booking.pk))
        assert len(response.content) > 0
