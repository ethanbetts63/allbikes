from rest_framework import serializers
from ..models import BlockedDate


class BlockedDateSerializer(serializers.ModelSerializer):
    # The view upserts on `date` (a day flips between blocked and force-open),
    # so drop the auto unique-validator that would 400 a repeat POST.
    date = serializers.DateField(validators=[])

    class Meta:
        model = BlockedDate
        fields = ['id', 'date', 'available', 'reason', 'created_at']
        read_only_fields = ['id', 'created_at']
