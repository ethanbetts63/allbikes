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

    class Meta:
        model = Order
        fields = [
            'id',
            'order_reference',
            'product',
            'product_name',
            'amount_paid',
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


class OrderStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['status']
