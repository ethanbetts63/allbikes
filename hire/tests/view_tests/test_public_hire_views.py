import math
import pytest
from datetime import date, timedelta
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from hire.models import HireBooking
from hire.tests.factories.hire_settings_factory import HireSettingsFactory
from hire.tests.factories.hire_booking_factory import HireBookingFactory
from inventory.tests.factories.motorcycle_factory import MotorcycleFactory


@pytest.fixture
def api_client():
    return APIClient()


def _future(days):
    return (date.today() + timedelta(days=days)).isoformat()


def _booking_payload(motorcycle_id, start_offset=3, end_offset=5):
    return {
        'motorcycle': motorcycle_id,
        'hire_start': _future(start_offset),
        'hire_end': _future(end_offset),
        'customer_name': 'Jane Rider',
        'customer_email': 'jane@example.com',
        'customer_phone': '0400000000',
        'terms_accepted': True,
        'is_of_age': True,
    }


@pytest.mark.django_db
class TestPublicHireSettingsView:

    def test_returns_settings_fields(self, api_client):
        """
        GIVEN HireSettings exists
        WHEN GET /api/hire/settings/
        THEN 200 is returned with bond_amount, advance_min_days, advance_max_days,
             weekly_discount_percent, monthly_discount_percent.
        """
        HireSettingsFactory(bond_amount='500.00', advance_min_days=2, advance_max_days=60)
        url = reverse('hire:hire-settings-public')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['bond_amount'] == '500.00'
        assert response.data['advance_min_days'] == 2
        assert response.data['advance_max_days'] == 60
        assert 'weekly_discount_percent' in response.data
        assert 'monthly_discount_percent' in response.data

    def test_creates_default_settings_if_none_exist(self, api_client):
        """
        GIVEN no HireSettings in the database
        WHEN GET /api/hire/settings/
        THEN 200 is returned with default values.
        """
        url = reverse('hire:hire-settings-public')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert 'bond_amount' in response.data
        assert 'advance_min_days' in response.data
        assert 'advance_max_days' in response.data


@pytest.mark.django_db
class TestHireAvailabilityView:

    URL = None

    @pytest.fixture(autouse=True)
    def set_url(self):
        self.URL = reverse('hire:hire-availability')

    def test_returns_available_true_when_no_bookings(self, api_client):
        """
        GIVEN a hire bike with no existing bookings
        WHEN GET availability for valid dates
        THEN available=True is returned.
        """
        bike = MotorcycleFactory(is_hire=True, status='for_sale')
        response = api_client.get(self.URL, {
            'motorcycle_id': bike.id,
            'start_date': _future(3),
            'end_date': _future(7),
        })
        assert response.status_code == status.HTTP_200_OK
        assert response.data['available'] is True

    def test_returns_available_false_for_overlapping_confirmed_booking(self, api_client):
        """
        GIVEN a confirmed booking for days 5–10
        WHEN checking availability for days 7–12 (overlapping)
        THEN available=False is returned.
        """
        booking = HireBookingFactory(
            hire_start=date.today() + timedelta(days=5),
            hire_end=date.today() + timedelta(days=10),
            status='confirmed',
        )
        response = api_client.get(self.URL, {
            'motorcycle_id': booking.motorcycle.id,
            'start_date': _future(7),
            'end_date': _future(12),
        })
        assert response.status_code == status.HTTP_200_OK
        assert response.data['available'] is False

    def test_cancelled_booking_does_not_block_availability(self, api_client):
        """
        GIVEN a cancelled booking for days 5–10
        WHEN checking availability for the same dates
        THEN available=True is returned.
        """
        booking = HireBookingFactory(
            hire_start=date.today() + timedelta(days=5),
            hire_end=date.today() + timedelta(days=10),
            status='cancelled',
        )
        response = api_client.get(self.URL, {
            'motorcycle_id': booking.motorcycle.id,
            'start_date': _future(5),
            'end_date': _future(10),
        })
        assert response.status_code == status.HTTP_200_OK
        assert response.data['available'] is True

    def test_booking_within_gap_blocks_availability(self, api_client):
        """
        GIVEN a confirmed booking for days 5–7 and the default gap of 1 day
        WHEN checking days 8–10 (within the gap)
        THEN available=False is returned.
        """
        booking = HireBookingFactory(
            hire_start=date.today() + timedelta(days=5),
            hire_end=date.today() + timedelta(days=7),
            status='confirmed',
        )
        response = api_client.get(self.URL, {
            'motorcycle_id': booking.motorcycle.id,
            'start_date': _future(8),
            'end_date': _future(10),
        })
        assert response.status_code == status.HTTP_200_OK
        assert response.data['available'] is False

    def test_booking_outside_gap_does_not_block(self, api_client):
        """
        GIVEN a confirmed booking for days 5–7 and the default gap of 1 day
        WHEN checking days 9–11 (outside the gap)
        THEN available=True is returned.
        """
        booking = HireBookingFactory(
            hire_start=date.today() + timedelta(days=5),
            hire_end=date.today() + timedelta(days=7),
            status='confirmed',
        )
        response = api_client.get(self.URL, {
            'motorcycle_id': booking.motorcycle.id,
            'start_date': _future(9),
            'end_date': _future(11),
        })
        assert response.status_code == status.HTTP_200_OK
        assert response.data['available'] is True

    def test_returns_400_when_params_missing(self, api_client):
        """
        GIVEN a request with no query params
        WHEN GET availability
        THEN 400 is returned.
        """
        response = api_client.get(self.URL)
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestHireBookingCreateView:

    URL = None

    @pytest.fixture(autouse=True)
    def set_url(self):
        self.URL = reverse('hire:hire-booking-create')

    @pytest.fixture(autouse=True)
    def default_settings(self):
        HireSettingsFactory(
            advance_min_days=1,
            advance_max_days=90,
            bond_amount='500.00',
            weekly_discount_percent=15,
            monthly_discount_percent=25,
        )

    @pytest.fixture
    def hire_bike(self):
        return MotorcycleFactory(
            is_hire=True,
            status='for_sale',
            daily_rate='100.00',
        )

    def test_creates_booking_and_returns_201(self, api_client, hire_bike):
        """
        GIVEN a valid hire bike and payload
        WHEN POST /api/hire/bookings/
        THEN 201 is returned with booking_reference and booking_id.
        """
        response = api_client.post(self.URL, _booking_payload(hire_bike.id), format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert 'booking_reference' in response.data
        assert 'booking_id' in response.data

    def test_booking_is_saved_as_pending_payment(self, api_client, hire_bike):
        """
        GIVEN a valid payload
        WHEN POST /api/hire/bookings/
        THEN the saved booking has status='pending_payment' (awaiting Stripe payment).
        """
        api_client.post(self.URL, _booking_payload(hire_bike.id), format='json')
        booking = HireBooking.objects.first()
        assert booking.status == 'pending_payment'

    def test_returns_400_when_start_date_too_soon(self, api_client, hire_bike):
        """
        GIVEN advance_min_days=1
        WHEN hire_start is today (0 days ahead)
        THEN 400 is returned.
        """
        payload = _booking_payload(hire_bike.id)
        payload['hire_start'] = date.today().isoformat()
        payload['hire_end'] = _future(2)
        response = api_client.post(self.URL, payload, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_returns_400_when_start_date_too_far(self, api_client, hire_bike):
        """
        GIVEN advance_max_days=90
        WHEN hire_start is 100 days from now
        THEN 400 is returned.
        """
        payload = _booking_payload(hire_bike.id)
        payload['hire_start'] = _future(100)
        payload['hire_end'] = _future(105)
        response = api_client.post(self.URL, payload, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_returns_400_when_end_before_start(self, api_client, hire_bike):
        """
        GIVEN hire_end is before hire_start
        WHEN POST /api/hire/bookings/
        THEN 400 is returned.
        """
        payload = _booking_payload(hire_bike.id)
        payload['hire_start'] = _future(5)
        payload['hire_end'] = _future(3)
        response = api_client.post(self.URL, payload, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_returns_400_when_bike_not_is_hire(self, api_client):
        """
        GIVEN a motorcycle with is_hire=False
        WHEN POST /api/hire/bookings/
        THEN 400 is returned.
        """
        bike = MotorcycleFactory(is_hire=False, status='for_sale', daily_rate='100.00')
        response = api_client.post(self.URL, _booking_payload(bike.id), format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_returns_400_when_dates_overlap_existing_booking(self, api_client, hire_bike):
        """
        GIVEN an existing confirmed booking for days 5–10
        WHEN a new booking for overlapping days 7–12 is submitted
        THEN 400 is returned.
        """
        HireBookingFactory(
            motorcycle=hire_bike,
            hire_start=date.today() + timedelta(days=5),
            hire_end=date.today() + timedelta(days=10),
            status='confirmed',
        )
        payload = _booking_payload(hire_bike.id, start_offset=7, end_offset=12)
        response = api_client.post(self.URL, payload, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_returns_400_when_no_rates_configured(self, api_client):
        """
        GIVEN a hire bike with no daily_rate set
        WHEN POST /api/hire/bookings/
        THEN 400 is returned.
        """
        bike = MotorcycleFactory(is_hire=True, status='for_sale', daily_rate=None)
        response = api_client.post(self.URL, _booking_payload(bike.id), format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_returns_400_when_fields_missing(self, api_client, hire_bike):
        """
        GIVEN an incomplete payload (no customer_phone)
        WHEN POST /api/hire/bookings/
        THEN 400 is returned.
        """
        payload = _booking_payload(hire_bike.id)
        del payload['customer_phone']
        response = api_client.post(self.URL, payload, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_effective_rate_uses_daily_for_short_booking(self, api_client):
        """
        GIVEN a bike with daily_rate=80.00 and a 3-day booking (under 7 days)
        WHEN a booking is created
        THEN effective_daily_rate is 80.00 (no discount applied).
        """
        bike = MotorcycleFactory(is_hire=True, status='for_sale', daily_rate='80.00')
        api_client.post(self.URL, _booking_payload(bike.id, start_offset=3, end_offset=5), format='json')
        booking = HireBooking.objects.first()
        assert float(booking.effective_daily_rate) == 80.00

    def test_weekly_discount_applied_for_7_day_booking(self, api_client):
        """
        GIVEN a bike at $100/day and weekly_discount_percent=15
        WHEN a 7-day booking is created
        THEN effective_daily_rate = ceil(100 * 0.85) = 85.
        """
        bike = MotorcycleFactory(is_hire=True, status='for_sale', daily_rate='100.00')
        payload = _booking_payload(bike.id, start_offset=3, end_offset=9)  # 7 days inclusive
        api_client.post(self.URL, payload, format='json')
        booking = HireBooking.objects.first()
        assert float(booking.effective_daily_rate) == math.ceil(100 * 0.85)

    def test_monthly_discount_applied_for_30_day_booking(self, api_client):
        """
        GIVEN a bike at $100/day and monthly_discount_percent=25
        WHEN a 30-day booking is created
        THEN effective_daily_rate = ceil(100 * 0.75) = 75.
        """
        bike = MotorcycleFactory(is_hire=True, status='for_sale', daily_rate='100.00')
        payload = _booking_payload(bike.id, start_offset=3, end_offset=32)  # 30 days inclusive
        api_client.post(self.URL, payload, format='json')
        booking = HireBooking.objects.first()
        assert float(booking.effective_daily_rate) == math.ceil(100 * 0.75)

    def test_effective_rate_rounds_up_to_nearest_dollar(self, api_client):
        """
        GIVEN a bike at $85/day and weekly_discount_percent=15 (85 * 0.85 = 72.25)
        WHEN a 7-day booking is created
        THEN effective_daily_rate is rounded up to 73.
        """
        bike = MotorcycleFactory(is_hire=True, status='for_sale', daily_rate='85.00')
        payload = _booking_payload(bike.id, start_offset=3, end_offset=9)  # 7 days inclusive
        api_client.post(self.URL, payload, format='json')
        booking = HireBooking.objects.first()
        assert float(booking.effective_daily_rate) == math.ceil(85 * 0.85)

    def test_total_hire_amount_is_rate_times_days(self, api_client):
        """
        GIVEN a bike at $80/day and a 3-day booking
        WHEN the booking is created
        THEN total_hire_amount = 80 * 3 = 240.
        """
        bike = MotorcycleFactory(is_hire=True, status='for_sale', daily_rate='80.00')
        payload = _booking_payload(bike.id, start_offset=3, end_offset=5)  # 3 days inclusive
        api_client.post(self.URL, payload, format='json')
        booking = HireBooking.objects.first()
        assert float(booking.total_hire_amount) == pytest.approx(240.00, rel=1e-2)

    def test_bond_snapshotted_from_hire_settings(self, api_client, hire_bike):
        """
        GIVEN HireSettings.bond_amount = 500.00
        WHEN a booking is created
        THEN booking.bond_amount = 500.00.
        """
        api_client.post(self.URL, _booking_payload(hire_bike.id), format='json')
        booking = HireBooking.objects.first()
        assert float(booking.bond_amount) == 500.00

    def test_response_includes_booking_id_for_payment_intent_creation(self, api_client, hire_bike):
        """
        GIVEN a valid booking payload
        WHEN the booking is created
        THEN booking_id is included in the response so the client can create a payment intent.
        """
        response = api_client.post(self.URL, _booking_payload(hire_bike.id), format='json')
        assert response.status_code == status.HTTP_201_CREATED
        booking = HireBooking.objects.first()
        assert response.data['booking_id'] == booking.id

    def test_returns_400_when_terms_not_accepted(self, api_client, hire_bike):
        """
        GIVEN a payload missing terms_accepted
        WHEN POST /api/hire/bookings/
        THEN 400 is returned.
        """
        payload = _booking_payload(hire_bike.id)
        del payload['terms_accepted']
        response = api_client.post(self.URL, payload, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_returns_400_when_terms_explicitly_false(self, api_client, hire_bike):
        """
        GIVEN a payload with terms_accepted=False
        WHEN POST /api/hire/bookings/
        THEN 400 is returned.
        """
        payload = _booking_payload(hire_bike.id)
        payload['terms_accepted'] = False
        response = api_client.post(self.URL, payload, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_terms_accepted_is_saved_on_booking(self, api_client, hire_bike):
        """
        GIVEN a valid payload with terms_accepted=True
        WHEN the booking is created
        THEN booking.terms_accepted is True in the database.
        """
        api_client.post(self.URL, _booking_payload(hire_bike.id), format='json')
        booking = HireBooking.objects.first()
        assert booking.terms_accepted is True

    def test_returns_400_when_is_of_age_missing(self, api_client, hire_bike):
        """
        GIVEN a payload missing is_of_age
        WHEN POST /api/hire/bookings/
        THEN 400 is returned.
        """
        payload = _booking_payload(hire_bike.id)
        del payload['is_of_age']
        response = api_client.post(self.URL, payload, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_returns_400_when_is_of_age_false(self, api_client, hire_bike):
        """
        GIVEN a payload with is_of_age=False
        WHEN POST /api/hire/bookings/
        THEN 400 is returned.
        """
        payload = _booking_payload(hire_bike.id)
        payload['is_of_age'] = False
        response = api_client.post(self.URL, payload, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_is_of_age_is_saved_on_booking(self, api_client, hire_bike):
        """
        GIVEN a valid payload with is_of_age=True
        WHEN the booking is created
        THEN booking.is_of_age is True in the database.
        """
        api_client.post(self.URL, _booking_payload(hire_bike.id), format='json')
        booking = HireBooking.objects.first()
        assert booking.is_of_age is True
