import pytest
from service.tests.factories.booking_request_log_factory import BookingRequestLogFactory

@pytest.mark.django_db
class TestBookingRequestLogModel:
    def test_booking_request_log_creation(self):
        """
        GIVEN a BookingRequestLog instance
        WHEN it is created
        THEN all fields should be saved correctly.
        """
        log = BookingRequestLogFactory()
        assert log.pk is not None
        assert log.customer_name
        assert log.customer_email
        assert log.status in ['Success', 'Failed']
        assert str(log) == f"Booking request for {log.customer_name} at {log.created_at.strftime('%Y-%m-%d %H:%M')}"
