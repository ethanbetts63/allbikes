from rest_framework import serializers
from ..models import Product
from .product_image_serializer import ProductImageSerializer


class ProductSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    in_stock = serializers.SerializerMethodField()
    low_stock = serializers.SerializerMethodField()

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
            "images",
            "in_stock",
            "low_stock",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "slug", "created_at", "updated_at"]

    def get_in_stock(self, obj):
        return obj.stock_quantity > 0

    def get_low_stock(self, obj):
        return 0 < obj.stock_quantity <= Product.LOW_STOCK_THRESHOLD
