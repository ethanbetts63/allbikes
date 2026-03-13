from rest_framework import serializers
from ..models import Order


class OrderCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = [
            'product',
            'customer_name',
            'customer_email',
            'customer_phone',
            'address_line1',
            'address_line2',
            'suburb',
            'state',
            'postcode',
        ]


class OrderSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_price = serializers.CharField(source='product.price', read_only=True)
    product_discount_price = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id',
            'order_reference',
            'product',
            'product_name',
            'product_price',
            'product_discount_price',
            'customer_name',
            'customer_email',
            'customer_phone',
            'address_line1',
            'address_line2',
            'suburb',
            'state',
            'postcode',
            'status',
            'created_at',
            'updated_at',
        ]

    def get_product_discount_price(self, obj):
        if obj.product.discount_price:
            return str(obj.product.discount_price)
        return None


class OrderStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['status']
