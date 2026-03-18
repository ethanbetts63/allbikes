from rest_framework import serializers
from ..models import Product
from .product_image_serializer import ProductImageSerializer


class ProductSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    in_stock = serializers.BooleanField(read_only=True)
    low_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "slug",
            "name",
            "brand",
            "description",
            "price",
            "discount_price",
            "stock_quantity",
            "is_active",
            "is_featured",
            "popular",
            "youtube_link",
            "images",
            "in_stock",
            "low_stock",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "slug", "created_at", "updated_at"]
