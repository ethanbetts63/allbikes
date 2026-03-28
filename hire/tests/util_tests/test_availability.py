import pytest
from datetime import date, timedelta

from hire.utils.availability import get_unavailable_motorcycle_ids, is_motorcycle_available
from hire.tests.factories.hire_booking_factory import HireBookingFactory
from inventory.tests.factories.motorcycle_factory import MotorcycleFactory


def _date(days_from_today):
    return date.today() + timedelta(days=days_from_today)


@pytest.mark.django_db
class TestGetUnavailableMotorycleIds:

    def test_returns_id_of_bike_with_overlapping_confirmed_booking(self):
        """
        GIVEN a confirmed booking for days 5–10
        WHEN queried for days 7–12 (overlapping)
        THEN the booked motorcycle's ID is in the result.
        """
        booking = HireBookingFactory(
            hire_start=_date(5), hire_end=_date(10), status='confirmed'
        )
        ids = list(get_unavailable_motorcycle_ids(_date(7), _date(12)))
        assert booking.motorcycle.id in ids

    def test_excludes_cancelled_bookings(self):
        """
        GIVEN only a cancelled booking for the queried range
        WHEN queried
        THEN no IDs are returned.
        """
        HireBookingFactory(hire_start=_date(5), hire_end=_date(10), status='cancelled')
        ids = list(get_unavailable_motorcycle_ids(_date(5), _date(10)))
        assert len(ids) == 0

    def test_includes_pending_payment_bookings(self):
        """
        GIVEN a pending_payment booking for the queried range
        WHEN queried
        THEN the motorcycle ID is returned (in-progress booking blocks availability).
        """
        booking = HireBookingFactory(
            hire_start=_date(5), hire_end=_date(10), status='pending_payment'
        )
        ids = list(get_unavailable_motorcycle_ids(_date(5), _date(10)))
        assert booking.motorcycle.id in ids

    def test_adjacent_booking_is_not_included(self):
        """
        GIVEN a confirmed booking for days 5–7
        WHEN queried for days 8–10 (no overlap)
        THEN no IDs are returned.
        """
        HireBookingFactory(hire_start=_date(5), hire_end=_date(7), status='confirmed')
        ids = list(get_unavailable_motorcycle_ids(_date(8), _date(10)))
        assert len(ids) == 0

    def test_returns_empty_when_no_bookings_exist(self):
        """
        GIVEN no bookings
        WHEN queried for any range
        THEN an empty result is returned.
        """
        MotorcycleFactory(is_hire=True, status='for_sale')
        ids = list(get_unavailable_motorcycle_ids(_date(1), _date(5)))
        assert len(ids) == 0


@pytest.mark.django_db
class TestIsMotorcycleAvailable:

    def test_returns_true_when_no_bookings(self):
        """
        GIVEN a motorcycle with no bookings
        WHEN checked for any date range
        THEN True is returned.
        """
        bike = MotorcycleFactory(is_hire=True, status='for_sale')
        assert is_motorcycle_available(bike.id, _date(3), _date(7)) is True

    def test_returns_false_for_overlapping_confirmed_booking(self):
        """
        GIVEN a confirmed booking for days 5–10
        WHEN checked for overlapping days 7–12
        THEN False is returned.
        """
        booking = HireBookingFactory(
            hire_start=_date(5), hire_end=_date(10), status='confirmed'
        )
        assert is_motorcycle_available(booking.motorcycle.id, _date(7), _date(12)) is False

    def test_returns_true_for_cancelled_booking(self):
        """
        GIVEN only a cancelled booking for the queried range
        WHEN checked
        THEN True is returned.
        """
        booking = HireBookingFactory(
            hire_start=_date(5), hire_end=_date(10), status='cancelled'
        )
        assert is_motorcycle_available(booking.motorcycle.id, _date(5), _date(10)) is True

    def test_returns_false_for_pending_payment_booking(self):
        """
        GIVEN a pending_payment booking for the queried range
        WHEN checked
        THEN False is returned.
        """
        booking = HireBookingFactory(
            hire_start=_date(5), hire_end=_date(10), status='pending_payment'
        )
        assert is_motorcycle_available(booking.motorcycle.id, _date(5), _date(10)) is False

    def test_returns_true_for_adjacent_booking(self):
        """
        GIVEN a confirmed booking for days 5–7
        WHEN checked for days 8–10
        THEN True is returned.
        """
        booking = HireBookingFactory(
            hire_start=_date(5), hire_end=_date(7), status='confirmed'
        )
        assert is_motorcycle_available(booking.motorcycle.id, _date(8), _date(10)) is True

    def test_different_motorcycle_is_not_affected(self):
        """
        GIVEN bike A has a confirmed booking
        WHEN bike B is checked for the same dates
        THEN True is returned.
        """
        booking = HireBookingFactory(
            hire_start=_date(5), hire_end=_date(10), status='confirmed'
        )
        other_bike = MotorcycleFactory(is_hire=True, status='for_sale')
        assert is_motorcycle_available(other_bike.id, _date(5), _date(10)) is True
