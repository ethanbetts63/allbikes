from datetime import date
from django.contrib.contenttypes.models import ContentType

from notifications.models import Message

from rest_framework import serializers

from parts.models import PartsOrder, PartsOrderItem, PartsSettings


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
    backorder_days_remaining = serializers.SerializerMethodField()
    backorder_overdue = serializers.SerializerMethodField()

    class Meta:
        model = PartsOrderItem
        fields = [
            'id', 'part_number', 'description', 'colour_name', 'model_name', 'model_code',
            'section_code', 'ref_number', 'quantity', 'unit_price', 'line_total',
            'status', 'backordered', 'backorder_since',
            'backorder_days_remaining', 'backorder_overdue',
        ]

    def _days_remaining(self, obj):
        if not obj.backordered or not obj.backorder_since:
            return None
        hold_days = self.context.get('backorder_hold_days')
        if hold_days is None:
            hold_days = PartsSettings.get().backorder_hold_days
        return hold_days - (date.today() - obj.backorder_since).days

    def get_backorder_days_remaining(self, obj):
        return self._days_remaining(obj)

    def get_backorder_overdue(self, obj):
        remaining = self._days_remaining(obj)
        return remaining is not None and remaining < 0


class AdminPartsOrderDetailSerializer(serializers.ModelSerializer):
    items = AdminPartsOrderItemSerializer(many=True, read_only=True)
    stripe_payment_intent_id = serializers.SerializerMethodField()
    payment_status = serializers.SerializerMethodField()
    messages = serializers.SerializerMethodField()

    class Meta:
        model = PartsOrder
        fields = [
            'id', 'order_reference', 'status', 'has_backorder',
            'customer_name', 'customer_email', 'customer_phone',
            'address_line1', 'address_line2', 'suburb', 'state', 'postcode', 'country',
            'subtotal', 'shipping', 'total', 'amount_paid',
            'admin_notes', 'dispatched_at', 'created_at', 'updated_at',
            'items', 'stripe_payment_intent_id', 'payment_status', 'messages',
        ]

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
