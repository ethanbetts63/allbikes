from rest_framework import serializers
from ..models import BlockedDate


class BlockedDateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlockedDate
        fields = ['id', 'date', 'reason', 'created_at']
        read_only_fields = ['id', 'created_at']
