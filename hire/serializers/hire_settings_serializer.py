from rest_framework import serializers
from ..models import HireSettings


class HireSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = HireSettings
        fields = ['bond_amount', 'advance_min_days', 'advance_max_days', 'minimum_age', 'booking_gap_days', 'weekly_discount_percent', 'monthly_discount_percent', 'updated_at']
        read_only_fields = ['updated_at']
