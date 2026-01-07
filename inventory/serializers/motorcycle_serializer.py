from rest_framework import serializers
from ..models import Motorcycle
from .motorcycle_image_serializer import MotorcycleImageSerializer

class MotorcycleSerializer(serializers.ModelSerializer):
    images = MotorcycleImageSerializer(many=True, read_only=True)
    
    class Meta:
        model = Motorcycle
        fields = [
            'id',
            'slug',
            'make',
            'model',
            'year',
            'price',
            'discount_price',
            'condition',
            'status',
            'is_featured',
            'odometer',
            'engine_size',
            'description',
            'youtube_link',
            'rego',
            'rego_exp',
            'stock_number',
            'warranty_months',
            'transmission',
            'images', 
        ]
