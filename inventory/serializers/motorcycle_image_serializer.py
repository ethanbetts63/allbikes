from rest_framework import serializers
from ..models import MotorcycleImage

class MotorcycleImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = MotorcycleImage
        fields = ['id', 'image', 'order', 'motorcycle']
        read_only_fields = ['id', 'motorcycle']
        extra_kwargs = {
            'order': {'required': False}
        }
