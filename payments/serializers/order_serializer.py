from rest_framework import serializers

from allbikes.australian_addresses import australian_address_errors
from ..models import Order


class OrderCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = [
            'product',
            'motorcycle',
            'payment_type',
            'selected_colour',
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

            motorcycle = data['motorcycle']
            available_colours = motorcycle.available_colours or []
            selected_colour = (data.get('selected_colour') or '').strip()
            if available_colours:
                colour_map = {colour.casefold(): colour for colour in available_colours}
                canonical_colour = colour_map.get(selected_colour.casefold())
                if not canonical_colour:
                    raise serializers.ValidationError({
                        'selected_colour': 'Select one of the available motorcycle colours.'
                    })
                data['selected_colour'] = canonical_colour
            elif selected_colour:
                raise serializers.ValidationError({
                    'selected_colour': 'This motorcycle does not have selectable colours.'
                })
        else:
            if data.get('selected_colour'):
                raise serializers.ValidationError({
                    'selected_colour': 'A colour can only be selected for a motorcycle reservation.'
                })
            for field in ('address_line1', 'suburb'):
                if not data.get(field):
                    raise serializers.ValidationError({field: 'This field is required.'})

        address_errors = australian_address_errors(
            state=data.get('state'),
            postcode=data.get('postcode'),
            required=not has_motorcycle,
        )
        if address_errors:
            raise serializers.ValidationError(address_errors)

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
            'selected_colour',
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
