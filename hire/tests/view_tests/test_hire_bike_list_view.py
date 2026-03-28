import pytest
from datetime import date, timedelta
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from hire.tests.factories.hire_booking_factory import HireBookingFactory
from inventory.tests.factories.motorcycle_factory import MotorcycleFactory


@pytest.fixture
def api_client():
    return APIClient()


def _future(days):
    return (date.today() + timedelta(days=days)).isoformat()


@pytest.mark.django_db
class TestHireBikeListView:

    URL = None

    @pytest.fixture(autouse=True)
    def set_url(self):
        self.URL = reverse('hire:hire-bike-list')

    def test_returns_only_hire_bikes(self, api_client):
        """
        GIVEN one hire bike and one non-hire bike
        WHEN GET /api/hire/bikes/
        THEN only the hire bike is returned.
        """
        MotorcycleFactory(is_hire=True, status='for_sale')
        MotorcycleFactory(is_hire=False, status='for_sale')
        response = api_client.get(self.URL)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1

    def test_excludes_on_hire_bikes(self, api_client):
        """
        GIVEN a hire bike with status='on_hire'
        WHEN GET /api/hire/bikes/
        THEN it is excluded from results.
        """
        MotorcycleFactory(is_hire=True, status='on_hire')
        MotorcycleFactory(is_hire=True, status='for_sale')
        response = api_client.get(self.URL)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1

    def test_returns_all_hire_bikes_when_no_dates_given(self, api_client):
        """
        GIVEN 3 hire bikes with no date params
        WHEN GET /api/hire/bikes/
        THEN all 3 are returned regardless of any existing bookings.
        """
        MotorcycleFactory.create_batch(3, is_hire=True, status='for_sale')
        response = api_client.get(self.URL)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 3

    def test_filters_out_booked_bikes_when_dates_given(self, api_client):
        """
        GIVEN bike A with a confirmed booking for days 5–10 and bike B with no bookings
        WHEN GET /api/hire/bikes/?start_date=day7&end_date=day9 (overlapping)
        THEN only bike B is returned.
        """
        booked_bike = MotorcycleFactory(is_hire=True, status='for_sale')
        available_bike = MotorcycleFactory(is_hire=True, status='for_sale')
        HireBookingFactory(
            motorcycle=booked_bike,
            hire_start=date.today() + timedelta(days=5),
            hire_end=date.today() + timedelta(days=10),
            status='confirmed',
        )
        response = api_client.get(self.URL, {'start_date': _future(7), 'end_date': _future(9)})
        assert response.status_code == status.HTTP_200_OK
        returned_ids = [b['id'] for b in response.data]
        assert available_bike.id in returned_ids
        assert booked_bike.id not in returned_ids

    def test_cancelled_booking_does_not_exclude_bike(self, api_client):
        """
        GIVEN a bike with only a cancelled booking for the requested dates
        WHEN GET /api/hire/bikes/ with those dates
        THEN the bike is still returned.
        """
        bike = MotorcycleFactory(is_hire=True, status='for_sale')
        HireBookingFactory(
            motorcycle=bike,
            hire_start=date.today() + timedelta(days=5),
            hire_end=date.today() + timedelta(days=10),
            status='cancelled',
        )
        response = api_client.get(self.URL, {'start_date': _future(5), 'end_date': _future(10)})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1

    def test_pending_payment_booking_does_not_exclude_bike(self, api_client):
        """
        GIVEN a bike with a pending_payment booking for the requested dates
        WHEN GET /api/hire/bikes/ with those dates
        THEN the bike is still returned (unpaid bookings do not block availability).
        """
        bike = MotorcycleFactory(is_hire=True, status='for_sale')
        HireBookingFactory(
            motorcycle=bike,
            hire_start=date.today() + timedelta(days=5),
            hire_end=date.today() + timedelta(days=10),
            status='pending_payment',
        )
        response = api_client.get(self.URL, {'start_date': _future(5), 'end_date': _future(10)})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1

    def test_adjacent_booking_does_not_exclude_bike(self, api_client):
        """
        GIVEN a bike booked for days 5–7
        WHEN requesting dates 8–10 (no overlap)
        THEN the bike is returned.
        """
        bike = MotorcycleFactory(is_hire=True, status='for_sale')
        HireBookingFactory(
            motorcycle=bike,
            hire_start=date.today() + timedelta(days=5),
            hire_end=date.today() + timedelta(days=7),
            status='confirmed',
        )
        response = api_client.get(self.URL, {'start_date': _future(8), 'end_date': _future(10)})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1

    def test_returns_400_for_invalid_date_format(self, api_client):
        """
        GIVEN dates in an invalid format
        WHEN GET /api/hire/bikes/ with those dates
        THEN 400 is returned.
        """
        response = api_client.get(self.URL, {'start_date': '01-04-2026', 'end_date': '05-04-2026'})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_ignores_single_date_param(self, api_client):
        """
        GIVEN only start_date (no end_date)
        WHEN GET /api/hire/bikes/
        THEN no date filtering is applied and all bikes are returned.
        """
        MotorcycleFactory.create_batch(2, is_hire=True, status='for_sale')
        response = api_client.get(self.URL, {'start_date': _future(5)})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2
