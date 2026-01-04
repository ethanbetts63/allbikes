from rest_framework import serializers
from ..models import JobType

class JobTypeSerializer(serializers.ModelSerializer):
    """
    Serializer for the JobType model.
    """
    class Meta:
        model = JobType
        fields = ['id', 'name', 'description', 'is_active']
