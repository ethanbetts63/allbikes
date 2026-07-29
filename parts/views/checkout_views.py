from django.db import transaction
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from allbikes.customer_access import get_customer_access_token
from parts.checkout import CheckoutError, create_parts_order
from parts.models import PartsOrder
from parts.serializers.order_serializers import (
    PartsCheckoutSerializer,
    PartsOrderConfirmationSerializer,
    PartsOrderCreatedSerializer,
    PartsOrderSerializer,
)
from parts.views.base import PublicAPIView
from payments.payment_intents import PaymentIntentError, create_or_reuse_payment_intent


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
        return Response(PartsOrderCreatedSerializer(order).data, status=201)


class RetrievePartsOrderView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, order_reference):
        order = get_object_or_404(
            PartsOrder.objects.prefetch_related('items'), order_reference=order_reference
        )
        return Response(PartsOrderSerializer(order).data)


class RetrievePartsOrderConfirmationView(PublicAPIView):
    """Token-protected, PII-free data required by the checkout confirmation UI."""

    def get(self, request, order_reference):
        token = get_customer_access_token(request)
        if not token:
            return Response({'detail': 'Order access token is required.'}, status=403)
        order = get_object_or_404(
            PartsOrder.objects.prefetch_related('items'),
            order_reference=order_reference,
            access_token=token,
        )
        return Response(PartsOrderConfirmationSerializer(order).data)


class CreatePartsPaymentIntentView(PublicAPIView):
    def post(self, request):
        order_reference = request.data.get('order_reference')
        access_token = (request.data.get('access_token') or '').strip()
        if not order_reference:
            return Response({'detail': 'order_reference is required.'}, status=400)
        if not access_token:
            return Response({'detail': 'access_token is required.'}, status=403)

        with transaction.atomic():
            try:
                order = PartsOrder.objects.select_for_update().get(
                    order_reference=order_reference, access_token=access_token
                )
            except PartsOrder.DoesNotExist:
                return Response({'detail': 'Order not found.'}, status=404)

            if order.status != 'pending_payment':
                return Response({'detail': 'Order is not awaiting payment.'}, status=400)

            try:
                secret = create_or_reuse_payment_intent(
                    target_field='parts_order',
                    target=order,
                    amount=order.total,
                    metadata={
                        'target_type': 'parts_order',
                        'parts_order_id': order.id,
                        'order_reference': order.order_reference,
                    },
                )
            except PaymentIntentError as exc:
                return Response({'detail': str(exc)}, status=409)
            return Response({'clientSecret': secret})
