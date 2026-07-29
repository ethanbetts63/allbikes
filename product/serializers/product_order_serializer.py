from rest_framework import serializers

from allbikes.australian_addresses import AUSTRALIAN_STATES, australian_address_errors
from product.models import ProductOrder


class ProductOrderCreateSerializer(serializers.ModelSerializer):
    state = serializers.ChoiceField(choices=AUSTRALIAN_STATES)
    postcode = serializers.RegexField(
        regex=r'^\d{4}$',
        error_messages={'invalid': 'Enter a valid four-digit Australian postcode.'},
    )

    class Meta:
        model = ProductOrder
        fields = [
            'product', 'customer_name', 'customer_email', 'customer_phone',
            'address_line1', 'address_line2', 'suburb', 'state', 'postcode',
            'terms_accepted',
        ]

    def validate_terms_accepted(self, value):
        if not value:
            raise serializers.ValidationError('You must accept the terms and conditions.')
        return value

    def validate(self, attrs):
        attrs = super().validate(attrs)
        errors = australian_address_errors(
            state=attrs.get('state'), postcode=attrs.get('postcode'), required=True
        )
        if errors:
            raise serializers.ValidationError(errors)
        if attrs['product'].stock_quantity <= 0:
            raise serializers.ValidationError({'product': 'This product is out of stock.'})
        return attrs

    def create(self, validated_data):
        product = validated_data['product']
        price = product.discount_price if product.discount_price and product.discount_price > 0 else product.price
        return ProductOrder.objects.create(
            **validated_data, unit_price_incl_gst=price, total=price, country='Australia'
        )


class ProductOrderSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    order_kind = serializers.CharField(default='product', read_only=True)

    class Meta:
        model = ProductOrder
        fields = [
            'id', 'order_kind', 'order_reference', 'product', 'product_name',
            'unit_price_incl_gst', 'total', 'amount_paid',
            'customer_name', 'customer_email', 'customer_phone',
            'address_line1', 'address_line2', 'suburb', 'state', 'postcode', 'country',
            'status', 'created_at', 'updated_at',
        ]


class ProductOrderCreatedSerializer(serializers.ModelSerializer):
    order_kind = serializers.CharField(default='product', read_only=True)

    class Meta:
        model = ProductOrder
        fields = ['id', 'order_kind', 'order_reference', 'access_token']


class ProductOrderStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductOrder
        fields = ['status']

    def validate_status(self, value):
        if value in {'paid', 'refunded'} and not hasattr(self.instance, 'payment'):
            raise serializers.ValidationError('This status requires an associated payment record.')
        return value
