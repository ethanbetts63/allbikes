import pytest
from service.models import BookingRequestLog
from service.serializers.booking_request_log_serializer import BookingRequestLogListSerializer, BookingRequestLogDetailSerializer

@pytest.mark.django_db
class TestBookingRequestLogSerializers:

    def test_list_serializer_fields(self):
        log = BookingRequestLog.objects.create(
            customer_name="John Doe",
            customer_email="john@example.com",
            vehicle_registration="ABC 123",
            request_payload="{}",
            status="pending"
        )
        serializer = BookingRequestLogListSerializer(log)
        data = serializer.data
        expected_fields = {'id', 'customer_name', 'customer_email', 'vehicle_registration', 'status', 'created_at'}
        assert set(data.keys()) == expected_fields

    def test_detail_serializer_fields(self):
        log = BookingRequestLog.objects.create(
            customer_name="John Doe",
            customer_email="john@example.com",
            vehicle_registration="ABC 123",
            request_payload="{}",
            response_status_code=200,
            response_body="{}",
            status="success"
        )
        serializer = BookingRequestLogDetailSerializer(log)
        data = serializer.data
        expected_fields = {
            'id', 'customer_name', 'customer_email', 'vehicle_registration',
            'request_payload', 'response_status_code', 'response_body',
            'status', 'created_at',
        }
        assert set(data.keys()) == expected_fields
