from rest_framework import serializers

from inventory.models import BikeOrder
from payments.models import DepositSettings


class BikeOrderCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BikeOrder
        fields = [
            'motorcycle', 'selected_colour', 'customer_name', 'customer_email',
            'customer_phone', 'terms_accepted',
        ]

    def validate_terms_accepted(self, value):
        if not value:
            raise serializers.ValidationError('You must accept the terms and conditions.')
        return value

    def validate(self, attrs):
        attrs = super().validate(attrs)
        if not attrs.get('customer_phone'):
            raise serializers.ValidationError({'customer_phone': 'Phone number is required.'})
        motorcycle = attrs['motorcycle']
        if motorcycle.status != 'for_sale':
            raise serializers.ValidationError({'motorcycle': 'This motorcycle is not available.'})
        colours = motorcycle.available_colours or []
        selected = (attrs.get('selected_colour') or '').strip()
        if colours:
            colour_map = {colour.casefold(): colour for colour in colours}
            canonical = colour_map.get(selected.casefold())
            if not canonical:
                raise serializers.ValidationError({'selected_colour': 'Select an available colour.'})
            attrs['selected_colour'] = canonical
        elif selected:
            raise serializers.ValidationError({'selected_colour': 'This motorcycle has no selectable colours.'})
        return attrs

    def create(self, validated_data):
        return BikeOrder.objects.create(
            **validated_data, deposit_amount=DepositSettings.get().deposit_amount
        )


class BikeOrderSerializer(serializers.ModelSerializer):
    motorcycle_name = serializers.SerializerMethodField()
    order_kind = serializers.CharField(default='bike', read_only=True)

    class Meta:
        model = BikeOrder
        fields = [
            'id', 'order_kind', 'order_reference', 'motorcycle', 'motorcycle_name',
            'selected_colour', 'deposit_amount', 'amount_paid',
            'customer_name', 'customer_email', 'customer_phone',
            'status', 'created_at', 'updated_at',
        ]

    def get_motorcycle_name(self, obj):
        motorcycle = obj.motorcycle
        return ' '.join(
            str(value) for value in (motorcycle.year, motorcycle.make, motorcycle.model) if value
        )


class BikeOrderCreatedSerializer(serializers.ModelSerializer):
    order_kind = serializers.CharField(default='bike', read_only=True)

    class Meta:
        model = BikeOrder
        fields = ['id', 'order_kind', 'order_reference', 'access_token']


class BikeOrderStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = BikeOrder
        fields = ['status']

    def validate_status(self, value):
        if value in {'paid', 'refunded'} and not self.instance.payments.exists():
            raise serializers.ValidationError('This status requires an associated payment record.')
        return value
