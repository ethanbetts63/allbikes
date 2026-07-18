from rest_framework import serializers
from ..models import Booking


class BookingAdminSerializer(serializers.ModelSerializer):
    """Full read/write serializer for the admin diary."""

    status_display = serializers.CharField(source='get_status_display', read_only=True)
    source_display = serializers.CharField(source='get_source_display', read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id',
            'drop_off_date',
            'drop_off_time',
            'customer_name',
            'customer_phone',
            'customer_email',
            'street_address',
            'suburb',
            'postcode',
            'registration',
            'make',
            'model',
            'year',
            'odometer',
            'job_description',
            'status',
            'status_display',
            'source',
            'source_display',
            'booking_log',
            'reminder_sent_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'booking_log', 'reminder_sent_at', 'created_at', 'updated_at']
