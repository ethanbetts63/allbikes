from rest_framework import serializers
from ..models import ServiceSettings

class ServiceSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceSettings
        fields = '__all__'
