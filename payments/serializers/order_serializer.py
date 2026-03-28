from rest_framework import serializers
from ..models import Order


class OrderCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = [
            'product',
            'motorcycle',
            'payment_type',
            'customer_name',
            'customer_email',
            'customer_phone',
            'address_line1',
            'address_line2',
            'suburb',
            'state',
            'postcode',
            'terms_accepted',
        ]

    def validate(self, data):
        if not data.get('terms_accepted'):
            raise serializers.ValidationError({'terms_accepted': 'You must accept the terms and conditions.'})

        has_product = bool(data.get('product'))
        has_motorcycle = bool(data.get('motorcycle'))
        if not has_product and not has_motorcycle:
            raise serializers.ValidationError("Either 'product' or 'motorcycle' must be provided.")
        if has_product and has_motorcycle:
            raise serializers.ValidationError("Provide either 'product' or 'motorcycle', not both.")

        if has_motorcycle:
            if not data.get('customer_phone'):
                raise serializers.ValidationError({'customer_phone': 'Phone number is required for motorcycle reservations.'})
        else:
            for field in ('address_line1', 'suburb', 'state', 'postcode'):
                if not data.get(field):
                    raise serializers.ValidationError({field: 'This field is required.'})

        return data


class OrderSerializer(serializers.ModelSerializer):
    product_name = serializers.SerializerMethodField()
    motorcycle_name = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id',
            'order_reference',
            'payment_type',
            'product',
            'product_name',
            'motorcycle',
            'motorcycle_name',
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

    def get_product_name(self, obj):
        return obj.product.name if obj.product_id else None

    def get_motorcycle_name(self, obj):
        if obj.motorcycle_id:
            m = obj.motorcycle
            name = f"{m.year} {m.make} {m.model}" if m.year else f"{m.make} {m.model}"
            return name.strip()
        return None


class OrderStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['status']
