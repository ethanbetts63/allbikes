from rest_framework import serializers
from ..models import Motorcycle
from .motorcycle_image_serializer import MotorcycleImageSerializer

class MotorcycleSerializer(serializers.ModelSerializer):
    images = MotorcycleImageSerializer(many=True, read_only=True)
    
    class Meta:
        model = Motorcycle
        fields = [
            'id',
            'make',
            'model',
            'year',
            'price',
            'condition',
            'status',
            'odometer',
            'engine_size',
            'description',
            'youtube_link',
            'rego',
            'rego_exp',
            'stock_number',
            'warranty_months',
            'images', # Nested images
        ]
