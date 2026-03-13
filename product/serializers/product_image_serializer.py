from rest_framework import serializers
from ..models import ProductImage


class ProductImageSerializer(serializers.ModelSerializer):
    thumbnail = serializers.SerializerMethodField()
    medium = serializers.ImageField(read_only=True)

    class Meta:
        model = ProductImage
        fields = ["id", "image", "thumbnail", "medium", "order", "product"]
        read_only_fields = ["id", "product", "thumbnail", "medium"]
        extra_kwargs = {"order": {"required": False}}

    def get_thumbnail(self, obj):
        if obj.order == 0:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.thumbnail.url)
            return obj.thumbnail.url
        return None
