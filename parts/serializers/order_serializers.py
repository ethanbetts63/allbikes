from rest_framework import serializers

from parts.models import PartsOrder, PartsOrderItem


class PartsCheckoutItemSerializer(serializers.Serializer):
    part_number = serializers.CharField(max_length=60)
    quantity = serializers.IntegerField(min_value=1, default=1)


class PartsCheckoutSerializer(serializers.Serializer):
    """Validates the customer/address fields + cart items posted at checkout."""

    customer_name = serializers.CharField(max_length=200)
    customer_email = serializers.EmailField()
    customer_phone = serializers.CharField(max_length=50, required=False, allow_blank=True)
    address_line1 = serializers.CharField(max_length=200)
    address_line2 = serializers.CharField(max_length=200, required=False, allow_blank=True)
    suburb = serializers.CharField(max_length=100)
    state = serializers.CharField(max_length=50, required=False, allow_blank=True)
    postcode = serializers.CharField(max_length=20)
    country = serializers.CharField(max_length=100, required=False, allow_blank=True)
    terms_accepted = serializers.BooleanField()
    items = PartsCheckoutItemSerializer(many=True)

    def validate_terms_accepted(self, value):
        if not value:
            raise serializers.ValidationError("You must accept the terms to place an order.")
        return value

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("Your cart is empty.")
        return value


class PartsOrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PartsOrderItem
        fields = [
            'part_number', 'description', 'colour_name', 'model_name', 'model_code',
            'section_code', 'ref_number', 'quantity', 'unit_price', 'line_total', 'backordered',
        ]


class PartsOrderSerializer(serializers.ModelSerializer):
    items = PartsOrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = PartsOrder
        fields = [
            'order_reference', 'status', 'customer_name', 'customer_email', 'customer_phone',
            'address_line1', 'address_line2', 'suburb', 'state', 'postcode', 'country',
            'has_backorder', 'subtotal', 'shipping', 'total', 'amount_paid', 'items',
        ]
        read_only_fields = fields
