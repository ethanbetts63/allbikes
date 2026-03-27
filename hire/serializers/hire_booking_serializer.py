from rest_framework import serializers
from ..models import HireBooking


class HireBookingSerializer(serializers.ModelSerializer):
    motorcycle_name = serializers.SerializerMethodField()

    class Meta:
        model = HireBooking
        fields = [
            'id',
            'booking_reference',
            'motorcycle',
            'motorcycle_name',
            'hire_start',
            'hire_end',
            'effective_daily_rate',
            'total_hire_amount',
            'bond_amount',
            'customer_name',
            'customer_email',
            'customer_phone',
            'status',
            'notes',
            'created_at',
            'updated_at',
        ]

    def get_motorcycle_name(self, obj):
        m = obj.motorcycle
        name = f"{m.year} {m.make} {m.model}" if m.year else f"{m.make} {m.model}"
        return name.strip()


class HireBookingStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = HireBooking
        fields = ['status', 'notes']
