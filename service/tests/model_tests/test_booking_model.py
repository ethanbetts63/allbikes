import pytest
from datetime import date, time
from service.models import Booking
from service.tests.factories import BookingFactory


@pytest.mark.django_db
class TestBookingModel:
    def test_defaults(self):
        booking = BookingFactory()
        assert booking.pk is not None
        assert booking.status == Booking.Status.NOT_STARTED
        assert booking.source == Booking.Source.MANUAL
        assert booking.reminder_sent_at is None

    def test_ordering_by_date_then_time(self):
        later = BookingFactory(drop_off_date=date(2026, 1, 2), drop_off_time=time(9, 0))
        early = BookingFactory(drop_off_date=date(2026, 1, 1), drop_off_time=time(15, 0))
        no_time = BookingFactory(drop_off_date=date(2026, 1, 1), drop_off_time=None)
        first_time = BookingFactory(drop_off_date=date(2026, 1, 1), drop_off_time=time(8, 0))

        ordered = list(Booking.objects.all())
        # Same day sorts by time ascending; null time sinks to the bottom of the day.
        assert ordered[0] == first_time
        assert ordered[1] == early
        assert ordered[2] == no_time
        assert ordered[3] == later

    def test_str(self):
        booking = BookingFactory(customer_name="Jane", bike_name="Vespa", drop_off_date=date(2026, 1, 1))
        assert "Jane" in str(booking)
        assert "Vespa" in str(booking)
