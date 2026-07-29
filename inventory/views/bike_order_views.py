from django.db import transaction
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from inventory.models import BikeOrder
from inventory.serializers import (
    BikeOrderCreateSerializer,
    BikeOrderCreatedSerializer,
    BikeOrderSerializer,
    BikeOrderStatusSerializer,
)
from payments.payment_intents import PaymentIntentError, create_or_reuse_payment_intent


class PublicView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]


class BikeOrderCreateView(PublicView):
    def post(self, request):
        serializer = BikeOrderCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        order = serializer.save()
        return Response(BikeOrderCreatedSerializer(order).data, status=201)


class BikeOrderDetailView(PublicView):
    def get(self, request, order_reference):
        token = (request.query_params.get('token') or '').strip()
        if not token:
            return Response({'detail': 'Order access token is required.'}, status=403)
        try:
            order = BikeOrder.objects.select_related('motorcycle').get(
                order_reference=order_reference, access_token=token
            )
        except BikeOrder.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=404)
        return Response(BikeOrderSerializer(order).data)


class BikeOrderPaymentIntentView(PublicView):
    def post(self, request, order_reference):
        token = (request.data.get('access_token') or '').strip()
        if not token:
            return Response({'detail': 'Order access token is required.'}, status=403)
        with transaction.atomic():
            try:
                order = BikeOrder.objects.select_for_update().select_related('motorcycle').get(
                    order_reference=order_reference, access_token=token
                )
            except BikeOrder.DoesNotExist:
                return Response({'detail': 'Order not found.'}, status=404)
            if order.status != 'pending_payment':
                return Response({'detail': 'Order is not awaiting payment.'}, status=400)
            if order.motorcycle.status != 'for_sale':
                return Response({'detail': 'This motorcycle is no longer available.'}, status=409)
            try:
                secret = create_or_reuse_payment_intent(
                    target_field='bike_order',
                    target=order,
                    amount=order.deposit_amount,
                    metadata={
                        'target_type': 'bike_order',
                        'bike_order_id': order.id,
                        'order_reference': order.order_reference,
                        **({'selected_colour': order.selected_colour} if order.selected_colour else {}),
                    },
                )
            except PaymentIntentError as exc:
                return Response({'detail': str(exc)}, status=409)
        return Response({'clientSecret': secret})


class OrderPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 200


class AdminBikeOrderListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        orders = BikeOrder.objects.select_related('motorcycle').order_by('-created_at')
        if request.query_params.get('status'):
            orders = orders.filter(status__in=request.query_params['status'].split(','))
        paginator = OrderPagination()
        page = paginator.paginate_queryset(orders, request)
        return paginator.get_paginated_response(BikeOrderSerializer(page, many=True).data)


class AdminBikeOrderDetailView(APIView):
    permission_classes = [IsAdminUser]

    def get_object(self, pk):
        try:
            return BikeOrder.objects.select_related('motorcycle').get(pk=pk)
        except BikeOrder.DoesNotExist:
            return None

    def get(self, request, pk):
        order = self.get_object(pk)
        return Response(BikeOrderSerializer(order).data) if order else Response({'detail': 'Order not found.'}, status=404)

    def patch(self, request, pk):
        order = self.get_object(pk)
        if not order:
            return Response({'detail': 'Order not found.'}, status=404)
        serializer = BikeOrderStatusSerializer(order, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        serializer.save()
        return Response(BikeOrderSerializer(order).data)
