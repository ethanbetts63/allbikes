from rest_framework import serializers
from ..models import SiteSettings

class FooterSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteSettings
        fields = [
            'phone_number',
            'email_address',
            'street_address',
            'address_locality',
            'address_region',
            'postal_code',
            'abn_number',
            'md_number',
            'mrb_number',
            'opening_hours_monday',
            'opening_hours_tuesday',
            'opening_hours_wednesday',
            'opening_hours_thursday',
            'opening_hours_friday',
            'opening_hours_saturday',
            'opening_hours_sunday',
        ]