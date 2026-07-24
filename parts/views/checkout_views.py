"""Public parts checkout endpoints (no auth): create order, retrieve, pay."""
from decimal import Decimal

import stripe
from django.conf import settings as django_settings
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from parts.checkout import CheckoutError, create_parts_order
from parts.models import PartsOrder
from parts.serializers.order_serializers import PartsCheckoutSerializer, PartsOrderSerializer

from payments.models import Payment

stripe.api_key = django_settings.STRIPE_SECRET_KEY
STRIPE_MINIMUM = Decimal('0.50')


class PublicAPIView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]


class CreatePartsOrderView(PublicAPIView):
    def post(self, request):
        serializer = PartsCheckoutSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        data = serializer.validated_data
        items = data.pop('items')
        try:
            order = create_parts_order(customer=data, items=items)
        except CheckoutError as exc:
            return Response(
                {'detail': exc.message, 'unavailable': exc.unavailable},
                status=409 if exc.unavailable else 400,
            )
        return Response(PartsOrderSerializer(order).data, status=201)


class RetrievePartsOrderView(PublicAPIView):
    def get(self, request, order_reference):
        order = get_object_or_404(
            PartsOrder.objects.prefetch_related('items'), order_reference=order_reference
        )
        return Response(PartsOrderSerializer(order).data)


class CreatePartsPaymentIntentView(PublicAPIView):
    def post(self, request):
        order_reference = request.data.get('order_reference')
        if not order_reference:
            return Response({'detail': 'order_reference is required.'}, status=400)

        try:
            order = PartsOrder.objects.get(order_reference=order_reference)
        except PartsOrder.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=404)

        if order.status != 'pending_payment':
            return Response({'detail': 'Order is not awaiting payment.'}, status=400)

        amount = max(order.total, STRIPE_MINIMUM)
        amount_cents = int(amount * 100)

        existing = Payment.objects.filter(parts_order=order, status='pending').first()
        if existing:
            if existing.amount == amount:
                intent = stripe.PaymentIntent.retrieve(existing.stripe_payment_intent_id)
                return Response({'clientSecret': intent.client_secret})
            stripe.PaymentIntent.cancel(existing.stripe_payment_intent_id)
            existing.delete()

        intent = stripe.PaymentIntent.create(
            amount=amount_cents,
            currency='aud',
            automatic_payment_methods={'enabled': True},
            metadata={
                'parts_order_id': order.id,
                'order_reference': order.order_reference,
            },
        )
        Payment.objects.create(
            parts_order=order,
            stripe_payment_intent_id=intent.id,
            amount=amount,
            status='pending',
        )
        return Response({'clientSecret': intent.client_secret})
