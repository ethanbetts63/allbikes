from rest_framework import serializers

from parts.models import PartsSettings


class PartsSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PartsSettings
        fields = [
            'markup_percentage', 'domestic_shipping_fee', 'international_shipping_fee',
            'enable_new_part_sales', 'backorder_hold_days', 'updated_at',
        ]
        read_only_fields = ['updated_at']
        extra_kwargs = {
            'markup_percentage': {'min_value': 0},
            'domestic_shipping_fee': {'min_value': 0},
            'international_shipping_fee': {'min_value': 0},
            'backorder_hold_days': {'min_value': 1, 'max_value': 90},
        }
