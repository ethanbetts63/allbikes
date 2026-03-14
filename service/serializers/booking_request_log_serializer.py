from rest_framework import serializers
from ..models import BookingRequestLog


class BookingRequestLogListSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingRequestLog
        fields = ['id', 'customer_name', 'customer_email', 'vehicle_registration', 'status', 'created_at']


class BookingRequestLogDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingRequestLog
        fields = [
            'id', 'customer_name', 'customer_email', 'vehicle_registration',
            'request_payload', 'response_status_code', 'response_body',
            'status', 'created_at',
        ]
