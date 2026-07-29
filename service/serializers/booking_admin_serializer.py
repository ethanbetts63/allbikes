from rest_framework import serializers

from allbikes.australian_addresses import AUSTRALIAN_STATES, australian_address_errors
from ..models import Booking


class BookingAdminSerializer(serializers.ModelSerializer):
    """Full read/write serializer for the admin diary."""

    status_display = serializers.CharField(source='get_status_display', read_only=True)
    source_display = serializers.CharField(source='get_source_display', read_only=True)
    state = serializers.ChoiceField(choices=AUSTRALIAN_STATES, required=False, allow_blank=True)
    postcode = serializers.RegexField(
        regex=r'^\d{4}$',
        required=False,
        allow_blank=True,
        error_messages={'invalid': 'Enter a valid four-digit Australian postcode.'},
    )

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
            'state',
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

    def validate(self, attrs):
        attrs = super().validate(attrs)
        address_fields_changed = self.instance is None or {'state', 'postcode'} & attrs.keys()
        if not address_fields_changed:
            return attrs
        state = attrs.get('state', getattr(self.instance, 'state', ''))
        postcode = attrs.get('postcode', getattr(self.instance, 'postcode', ''))
        errors = australian_address_errors(state=state, postcode=postcode, required=False)
        if errors:
            raise serializers.ValidationError(errors)
        return attrs
