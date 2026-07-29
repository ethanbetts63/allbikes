from decimal import Decimal

from django.contrib.contenttypes.models import ContentType

from notifications.models import Message

from rest_framework import serializers

from parts.models import Part, PartsOrder, PartsOrderItem, PartsSettings


def supplier_price_map(order):
    """part_number -> Part, for current supplier (wholesale) pricing."""
    return Part.objects.in_bulk(
        [item.part_number for item in order.items.all()], field_name='part_number'
    )


class AdminPartsOrderListSerializer(serializers.ModelSerializer):
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = PartsOrder
        fields = [
            'id', 'order_reference', 'customer_name', 'customer_email',
            'status', 'has_backorder', 'total', 'item_count', 'created_at',
        ]

    def get_item_count(self, obj):
        return obj.items.count()


class AdminPartsOrderItemSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()
    supplier_line_total = serializers.SerializerMethodField()
    gross_profit = serializers.SerializerMethodField()

    class Meta:
        model = PartsOrderItem
        fields = [
            'id', 'part_number', 'description', 'colour_name', 'model_name', 'model_code',
            'section_code', 'ref_number', 'quantity', 'unit_price', 'line_total',
            'status', 'backordered',
            'supplier_line_total', 'gross_profit',
        ]

    def get_status(self, obj):
        """`completed` is derived, never stored.

        Completing an order completes every line that was not refunded, so
        there is only ever one stored write path (items -> order, via
        PartsOrder.recompute_rollup) and nothing to keep in sync.
        """
        order_status = self.context.get('order_status')
        if order_status is None:
            order_status = obj.parts_order.status
        if obj.status != 'refunded' and order_status == 'completed':
            return 'completed'
        return obj.status

    def _supplier_line_total(self, obj):
        """Current supplier cost for this line, or None if the part has no live price."""
        prices = self.context.get('supplier_prices')
        if prices is None:
            prices = supplier_price_map(obj.parts_order)
        part = prices.get(obj.part_number)
        if part is None or part.wholesale_price_incl_gst is None:
            return None
        return part.wholesale_price_incl_gst * obj.quantity

    def get_supplier_line_total(self, obj):
        return self._supplier_line_total(obj)

    def get_gross_profit(self, obj):
        cost = self._supplier_line_total(obj)
        return None if cost is None else obj.line_total - cost


class AdminPartsOrderDetailSerializer(serializers.ModelSerializer):
    items = AdminPartsOrderItemSerializer(many=True, read_only=True)
    stripe_payment_intent_id = serializers.SerializerMethodField()
    payment_status = serializers.SerializerMethodField()
    messages = serializers.SerializerMethodField()
    margin = serializers.SerializerMethodField()
    backorder_days_remaining = serializers.SerializerMethodField()
    backorder_window_expired = serializers.SerializerMethodField()
    backorder_hold_days = serializers.SerializerMethodField()

    class Meta:
        model = PartsOrder
        fields = [
            'id', 'order_reference', 'status', 'has_backorder',
            'backorder_days_remaining', 'backorder_window_expired', 'backorder_hold_days',
            'customer_name', 'customer_email', 'customer_phone',
            'address_line1', 'address_line2', 'suburb', 'state', 'postcode', 'country',
            'subtotal', 'shipping', 'total', 'amount_paid',
            'admin_notes', 'dispatched_at', 'created_at', 'updated_at',
            'items', 'stripe_payment_intent_id', 'payment_status', 'messages', 'margin',
        ]

    def _hold_days(self):
        hold_days = self.context.get('backorder_hold_days')
        return PartsSettings.get().backorder_hold_days if hold_days is None else hold_days

    def get_backorder_hold_days(self, obj):
        return self._hold_days()

    def get_backorder_days_remaining(self, obj):
        return obj.backorder_days_remaining(self._hold_days())

    def get_backorder_window_expired(self, obj):
        return obj.backorder_window_expired(self._hold_days())

    def get_margin(self, obj):
        """Order-level supplier cost vs. what the customer paid for the parts.

        Shipping is excluded — it isn't a supplier cost. Lines whose part has no
        live feed price are skipped from the cost total and flagged instead.
        """
        prices = self.context.get('supplier_prices')
        if prices is None:
            prices = supplier_price_map(obj)
        supplier_total = Decimal('0.00')
        customer_total = Decimal('0.00')
        unpriced = False
        for item in obj.items.all():
            customer_total += item.line_total
            part = prices.get(item.part_number)
            if part is None or part.wholesale_price_incl_gst is None:
                unpriced = True
                continue
            supplier_total += part.wholesale_price_incl_gst * item.quantity
        return {
            'supplier_parts_total': supplier_total,
            'customer_parts_total': customer_total,
            'gross_profit_total': customer_total - supplier_total,
            'has_unpriced_items': unpriced,
        }

    def get_stripe_payment_intent_id(self, obj):
        payment = getattr(obj, 'payment', None)
        return payment.stripe_payment_intent_id if payment else None

    def get_payment_status(self, obj):
        payment = getattr(obj, 'payment', None)
        return payment.status if payment else None

    def get_messages(self, obj):
        content_type = ContentType.objects.get_for_model(PartsOrder)
        return list(Message.objects.filter(content_type=content_type, object_id=obj.id).values(
            'id', 'message_type', 'to', 'subject', 'status', 'sent_at', 'created_at',
        ))


class AdminPartsOrderUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PartsOrder
        fields = ['status', 'admin_notes']
