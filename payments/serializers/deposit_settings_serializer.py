from rest_framework import serializers
from ..models import DepositSettings


class DepositSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = DepositSettings
        fields = ['deposit_amount', 'updated_at']
        read_only_fields = ['updated_at']
