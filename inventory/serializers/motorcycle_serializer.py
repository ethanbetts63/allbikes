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
            'vehicle_type',
            'status',
            'popular',
            'include_in_stock_alerts',
            'odometer',
            'engine_size',
            'description',
            'youtube_link',
            'rego',
            'rego_exp',
            'stock_number',
            'warranty_months',
            'available_colours',
            'transmission',
            'images',
            'date_posted',
            'is_lams_approved',
            'is_hire',
            'daily_rate',
        ]

    def validate_available_colours(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Available colours must be a list.")

        colours = []
        seen = set()
        for colour in value:
            if not isinstance(colour, str):
                raise serializers.ValidationError("Each colour must be a text name.")

            colour = colour.strip()
            if not colour:
                continue
            if len(colour) > 100:
                raise serializers.ValidationError("Colour names cannot exceed 100 characters.")

            key = colour.casefold()
            if key not in seen:
                seen.add(key)
                colours.append(colour)

        return colours

    def validate(self, attrs):
        condition = attrs.get('condition', getattr(self.instance, 'condition', None))
        vehicle_type = attrs.get('vehicle_type', getattr(self.instance, 'vehicle_type', None))
        if condition != 'new' or vehicle_type != 'scooter':
            attrs['available_colours'] = []
        return attrs
