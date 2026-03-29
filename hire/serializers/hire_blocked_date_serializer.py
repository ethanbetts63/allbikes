from rest_framework import serializers
from ..models import HireBlockedDate


class HireBlockedDateSerializer(serializers.ModelSerializer):
    motorcycle_name = serializers.SerializerMethodField()

    class Meta:
        model = HireBlockedDate
        fields = ['id', 'date_from', 'date_to', 'reason', 'motorcycle', 'motorcycle_name', 'created_at']
        read_only_fields = ['created_at']

    def get_motorcycle_name(self, obj):
        return str(obj.motorcycle) if obj.motorcycle else None

    def validate(self, data):
        if data.get('date_to') and data.get('date_from') and data['date_to'] < data['date_from']:
            raise serializers.ValidationError('End date must be on or after start date.')
        return data
