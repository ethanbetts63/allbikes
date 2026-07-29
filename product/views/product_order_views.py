from django.db import transaction
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from payments.payment_intents import create_or_reuse_payment_intent
from product.models import ProductOrder
from product.serializers import (
    ProductOrderCreateSerializer,
    ProductOrderCreatedSerializer,
    ProductOrderSerializer,
    ProductOrderStatusSerializer,
)


class PublicView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]


class ProductOrderCreateView(PublicView):
    def post(self, request):
        serializer = ProductOrderCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        order = serializer.save()
        return Response(ProductOrderCreatedSerializer(order).data, status=201)


class ProductOrderDetailView(PublicView):
    def get(self, request, order_reference):
        token = (request.query_params.get('token') or '').strip()
        if not token:
            return Response({'detail': 'Order access token is required.'}, status=403)
        try:
            order = ProductOrder.objects.select_related('product').get(
                order_reference=order_reference, access_token=token
            )
        except ProductOrder.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=404)
        return Response(ProductOrderSerializer(order).data)


class ProductOrderPaymentIntentView(PublicView):
    def post(self, request, order_reference):
        token = (request.data.get('access_token') or '').strip()
        if not token:
            return Response({'detail': 'Order access token is required.'}, status=403)
        with transaction.atomic():
            try:
                order = ProductOrder.objects.select_for_update().select_related('product').get(
                    order_reference=order_reference, access_token=token
                )
            except ProductOrder.DoesNotExist:
                return Response({'detail': 'Order not found.'}, status=404)
            if order.status != 'pending_payment':
                return Response({'detail': 'Order is not awaiting payment.'}, status=400)
            if order.product.stock_quantity <= 0:
                return Response({'detail': 'This product is out of stock.'}, status=409)
            secret = create_or_reuse_payment_intent(
                target_field='product_order',
                target=order,
                amount=order.total,
                metadata={
                    'target_type': 'product_order',
                    'product_order_id': order.id,
                    'order_reference': order.order_reference,
                },
            )
        return Response({'clientSecret': secret})


class OrderPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 200


class AdminProductOrderListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        orders = ProductOrder.objects.select_related('product').order_by('-created_at')
        if request.query_params.get('status'):
            orders = orders.filter(status__in=request.query_params['status'].split(','))
        paginator = OrderPagination()
        page = paginator.paginate_queryset(orders, request)
        return paginator.get_paginated_response(ProductOrderSerializer(page, many=True).data)


class AdminProductOrderDetailView(APIView):
    permission_classes = [IsAdminUser]

    def get_object(self, pk):
        try:
            return ProductOrder.objects.select_related('product').get(pk=pk)
        except ProductOrder.DoesNotExist:
            return None

    def get(self, request, pk):
        order = self.get_object(pk)
        return Response(ProductOrderSerializer(order).data) if order else Response({'detail': 'Order not found.'}, status=404)

    def patch(self, request, pk):
        order = self.get_object(pk)
        if not order:
            return Response({'detail': 'Order not found.'}, status=404)
        serializer = ProductOrderStatusSerializer(order, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        serializer.save()
        return Response(ProductOrderSerializer(order).data)
