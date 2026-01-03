from rest_framework import serializers
from ..models import MotorcycleImage

class MotorcycleImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = MotorcycleImage
        fields = ['image']
