from rest_framework import serializers
from ..models import MotorcycleImage

class MotorcycleImageSerializer(serializers.ModelSerializer):
    thumbnail = serializers.SerializerMethodField()
    medium = serializers.ImageField(source='medium', read_only=True)

    class Meta:
        model = MotorcycleImage
        fields = ['id', 'image', 'thumbnail', 'medium', 'order', 'motorcycle']
        read_only_fields = ['id', 'motorcycle', 'thumbnail', 'medium']
        extra_kwargs = {
            'order': {'required': False}
        }

    def get_thumbnail(self, obj):
        if obj.order == 0:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.thumbnail.url)
            return obj.thumbnail.url
        return None
