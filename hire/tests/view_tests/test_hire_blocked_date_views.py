import pytest
from datetime import date, timedelta
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from data_management.tests.factories.user_factory import UserFactory
from hire.models import HireBlockedDate
from hire.tests.factories.hire_blocked_date_factory import HireBlockedDateFactory
from inventory.tests.factories.motorcycle_factory import MotorcycleFactory


def _date(days):
    return str(date.today() + timedelta(days=days))


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def admin_client():
    client = APIClient()
    user = UserFactory(is_staff=True, is_superuser=True)
    client.force_authenticate(user=user)
    return client


# ---------------------------------------------------------------------------
# Public blocked dates endpoint
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestHireBlockedDatesPublicView:

    URL = reverse('hire:hire-blocked-dates-public')

    def test_returns_global_blocked_dates(self, api_client):
        """
        GIVEN 2 global and 1 bike-specific blocked date
        WHEN GET /api/hire/blocked-dates/
        THEN only the 2 global entries are returned.
        """
        HireBlockedDateFactory.create_batch(2, motorcycle=None)
        bike = MotorcycleFactory(is_hire=True)
        HireBlockedDateFactory(motorcycle=bike)
        response = api_client.get(self.URL)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2

    def test_returns_empty_when_no_blocked_dates(self, api_client):
        response = api_client.get(self.URL)
        assert response.status_code == status.HTTP_200_OK
        assert response.data == []

    def test_anonymous_can_access(self, api_client):
        response = api_client.get(self.URL)
        assert response.status_code == status.HTTP_200_OK


# ---------------------------------------------------------------------------
# Admin blocked dates CRUD
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestAdminHireBlockedDateViews:

    LIST_URL = reverse('hire:admin-hire-blocked-dates-list')

    def test_admin_can_list_all_blocked_dates(self, admin_client):
        """
        GIVEN 2 global and 1 bike-specific blocked date
        WHEN GET /api/hire/admin/blocked-dates/
        THEN all 3 are returned.
        """
        HireBlockedDateFactory.create_batch(2, motorcycle=None)
        bike = MotorcycleFactory(is_hire=True)
        HireBlockedDateFactory(motorcycle=bike)
        response = admin_client.get(self.LIST_URL)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 3

    def test_admin_can_create_global_blocked_date(self, admin_client):
        response = admin_client.post(self.LIST_URL, {
            'date_from': _date(5),
            'date_to': _date(7),
            'reason': 'Easter',
        }, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert HireBlockedDate.objects.count() == 1
        assert HireBlockedDate.objects.first().motorcycle is None

    def test_admin_can_create_bike_specific_blocked_date(self, admin_client):
        bike = MotorcycleFactory(is_hire=True)
        response = admin_client.post(self.LIST_URL, {
            'date_from': _date(5),
            'date_to': _date(7),
            'motorcycle': bike.id,
        }, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert HireBlockedDate.objects.first().motorcycle == bike

    def test_returns_400_when_date_to_before_date_from(self, admin_client):
        response = admin_client.post(self.LIST_URL, {
            'date_from': _date(7),
            'date_to': _date(5),
        }, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_admin_can_delete_blocked_date(self, admin_client):
        blocked = HireBlockedDateFactory()
        url = reverse('hire:admin-hire-blocked-dates-detail', kwargs={'pk': blocked.pk})
        response = admin_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert HireBlockedDate.objects.count() == 0

    def test_delete_returns_404_for_missing_id(self, admin_client):
        url = reverse('hire:admin-hire-blocked-dates-detail', kwargs={'pk': 9999})
        response = admin_client.delete(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_anonymous_cannot_access_admin_endpoint(self, api_client):
        response = api_client.get(self.LIST_URL)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


# ---------------------------------------------------------------------------
# Booking create blocked by global closure
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestBookingBlockedByClosedDates:

    URL = reverse('hire:hire-booking-create')

    def _payload(self, motorcycle_id, start, end):
        return {
            'motorcycle': motorcycle_id,
            'hire_start': start,
            'hire_end': end,
            'customer_name': 'Jane Rider',
            'customer_email': 'jane@example.com',
            'customer_phone': '0400000000',
            'terms_accepted': True,
            'is_of_age': True,
            'extras': [],
        }

    def test_returns_400_when_range_overlaps_global_closure(self, api_client):
        """
        GIVEN a global blocked date range of days 5–7
        WHEN a booking is attempted for days 4–6
        THEN 400 is returned with a closure error message.
        """
        bike = MotorcycleFactory(is_hire=True, status='for_sale', daily_rate='100.00')
        HireBlockedDateFactory(date_from=date.today() + timedelta(days=5), date_to=date.today() + timedelta(days=7), motorcycle=None)
        payload = self._payload(bike.id, _date(4), _date(6))
        response = api_client.post(self.URL, payload, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'closed' in response.data['error'].lower()

    def test_returns_400_when_range_is_entirely_within_closure(self, api_client):
        bike = MotorcycleFactory(is_hire=True, status='for_sale', daily_rate='100.00')
        HireBlockedDateFactory(date_from=date.today() + timedelta(days=3), date_to=date.today() + timedelta(days=10), motorcycle=None)
        payload = self._payload(bike.id, _date(4), _date(6))
        response = api_client.post(self.URL, payload, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_booking_succeeds_outside_closure(self, api_client):
        """
        GIVEN a global blocked date range of days 10–12
        WHEN a booking is attempted for days 4–6 (no overlap)
        THEN the booking is created successfully.
        """
        bike = MotorcycleFactory(is_hire=True, status='for_sale', daily_rate='100.00')
        HireBlockedDateFactory(date_from=date.today() + timedelta(days=10), date_to=date.today() + timedelta(days=12), motorcycle=None)
        payload = self._payload(bike.id, _date(4), _date(6))
        response = api_client.post(self.URL, payload, format='json')
        assert response.status_code == status.HTTP_201_CREATED

    def test_bike_specific_block_does_not_prevent_other_bikes(self, api_client):
        """
        GIVEN a bike-specific block on bike A for days 4–6
        WHEN bike B is booked for the same dates
        THEN the booking succeeds.
        """
        bike_a = MotorcycleFactory(is_hire=True, status='for_sale', daily_rate='100.00')
        bike_b = MotorcycleFactory(is_hire=True, status='for_sale', daily_rate='100.00')
        HireBlockedDateFactory(date_from=date.today() + timedelta(days=4), date_to=date.today() + timedelta(days=6), motorcycle=bike_a)
        payload = self._payload(bike_b.id, _date(4), _date(6))
        response = api_client.post(self.URL, payload, format='json')
        assert response.status_code == status.HTTP_201_CREATED
