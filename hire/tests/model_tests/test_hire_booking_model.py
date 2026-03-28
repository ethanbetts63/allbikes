import re
import pytest
from datetime import date
from decimal import Decimal

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

    def test_total_charged_is_sum_of_hire_amount_and_bond(self):
        """
        GIVEN a booking with total_hire_amount=300.00 and bond_amount=500.00
        WHEN total_charged is accessed
        THEN it returns Decimal('800.00'), not a string concatenation.
        """
        booking = HireBookingFactory(total_hire_amount='300.00', bond_amount='500.00')
        assert booking.total_charged == Decimal('800.00')

    def test_total_charged_with_decimal_values(self):
        """
        GIVEN a booking with fractional amounts
        WHEN total_charged is accessed
        THEN decimal arithmetic is used, not string concatenation.
        """
        booking = HireBookingFactory(total_hire_amount='123.45', bond_amount='250.00')
        assert booking.total_charged == Decimal('373.45')

    def test_num_days_is_inclusive(self):
        """
        GIVEN a booking with hire_start and hire_end on different dates
        WHEN num_days is accessed
        THEN it returns (end - start).days + 1 (both endpoints inclusive).
        """
        booking = HireBookingFactory(
            hire_start=date(2026, 1, 1),
            hire_end=date(2026, 1, 3),
        )
        assert booking.num_days == 3

    def test_num_days_same_day_is_one(self):
        """
        GIVEN a booking where hire_start == hire_end
        WHEN num_days is accessed
        THEN it returns 1 (a single-day hire counts as one day).
        """
        booking = HireBookingFactory(
            hire_start=date(2026, 6, 15),
            hire_end=date(2026, 6, 15),
        )
        assert booking.num_days == 1
