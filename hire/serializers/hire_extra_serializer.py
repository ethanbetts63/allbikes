from rest_framework import serializers
from ..models import HireExtra, HireBookingExtra


class HireExtraSerializer(serializers.ModelSerializer):
    class Meta:
        model = HireExtra
        fields = ['id', 'name', 'price_per_day', 'is_active']


class HireBookingExtraSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='extra.name', read_only=True)

    class Meta:
        model = HireBookingExtra
        fields = ['id', 'name', 'quantity', 'price_per_day_snapshot', 'total_amount']
