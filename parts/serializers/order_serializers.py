from rest_framework import serializers

from parts.models import PartsOrder, PartsOrderItem


class PartsCheckoutItemSerializer(serializers.Serializer):
    part_number = serializers.CharField(max_length=60)
    fitment_key = serializers.CharField(max_length=200, required=False)
    section_part_id = serializers.IntegerField(min_value=1, required=False)
    quantity = serializers.IntegerField(min_value=1, default=1)

    def validate(self, attrs):
        if not attrs.get('fitment_key') and not attrs.get('section_part_id'):
            raise serializers.ValidationError('A catalogue fitment is required.')
        return attrs


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
    terms_accepted = serializers.BooleanField()
    items = PartsCheckoutItemSerializer(many=True)

    def validate_terms_accepted(self, value):
        if not value:
            raise serializers.ValidationError("You must accept the terms to place an order.")
        return value

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("Your cart is empty.")
        if len(value) > 50:
            raise serializers.ValidationError("Your cart can contain at most 50 different parts.")
        fitments = [item.get('fitment_key') or f"legacy:{item.get('section_part_id')}" for item in value]
        if len(fitments) != len(set(fitments)):
            raise serializers.ValidationError("Each catalogue fitment can only appear once in your cart.")
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
            'has_backorder', 'backorder_hold_days', 'subtotal', 'shipping', 'total', 'amount_paid', 'items',
        ]
        read_only_fields = fields


class PartsOrderCreatedSerializer(serializers.ModelSerializer):
    """Returned only to the browser that has just created the order."""

    class Meta:
        model = PartsOrder
        fields = ['order_reference', 'access_token']


class PartsOrderConfirmationSerializer(serializers.ModelSerializer):
    """Customer confirmation data. Deliberately excludes all personal details."""
    items = PartsOrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = PartsOrder
        fields = [
            'order_reference', 'status', 'has_backorder', 'backorder_hold_days',
            'subtotal', 'shipping', 'total', 'amount_paid', 'items',
        ]
        read_only_fields = fields
