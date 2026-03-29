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
            'created_at',
            'updated_at',
        ]

    def get_motorcycle_name(self, obj):
        return str(obj.motorcycle)


class HireBookingCreateSerializer(serializers.Serializer):
    motorcycle = serializers.IntegerField()
    hire_start = serializers.DateField()
    hire_end = serializers.DateField()
    customer_name = serializers.CharField(max_length=200)
    customer_email = serializers.EmailField()
    customer_phone = serializers.CharField(max_length=50)
    terms_accepted = serializers.BooleanField()
    is_of_age = serializers.BooleanField()

    def validate_terms_accepted(self, value):
        if not value:
            raise serializers.ValidationError('You must accept the terms and conditions.')
        return value

    def validate_is_of_age(self, value):
        if not value:
            raise serializers.ValidationError('You must meet the minimum age requirement to hire a motorcycle.')
        return value


class HireBookingStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = HireBooking
        fields = ['status']
