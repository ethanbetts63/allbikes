import re
import pytest

from hire.tests.factories.hire_booking_factory import HireBookingFactory


@pytest.mark.django_db
class TestHireBookingModel:

    def test_booking_reference_auto_generated(self):
        """
        GIVEN a new HireBooking saved without a reference
        WHEN it is saved
        THEN booking_reference is populated automatically.
        """
        booking = HireBookingFactory()
        assert booking.booking_reference

    def test_booking_reference_format(self):
        """
        GIVEN a new HireBooking
        WHEN saved
        THEN booking_reference matches the HR-XXXXXXXX format.
        """
        booking = HireBookingFactory()
        assert re.match(r'^HR-[0-9A-F]{8}$', booking.booking_reference)

    def test_str_returns_booking_reference(self):
        """
        GIVEN a HireBooking
        WHEN str() is called
        THEN the booking_reference is returned.
        """
        booking = HireBookingFactory()
        assert str(booking) == booking.booking_reference

    def test_two_bookings_have_unique_references(self):
        """
        GIVEN two HireBookings
        WHEN both are saved
        THEN their booking_references are different.
        """
        b1 = HireBookingFactory()
        b2 = HireBookingFactory()
        assert b1.booking_reference != b2.booking_reference

    def test_existing_reference_not_overwritten_on_resave(self):
        """
        GIVEN a HireBooking with an existing reference
        WHEN it is saved again
        THEN the reference remains unchanged.
        """
        booking = HireBookingFactory()
        original_ref = booking.booking_reference
        booking.save()
        booking.refresh_from_db()
        assert booking.booking_reference == original_ref
