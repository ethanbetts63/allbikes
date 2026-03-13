from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from ..models import Order
from ..serializers.order_serializer import OrderCreateSerializer, OrderSerializer
from product.models import Product


class OrderCreateView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OrderCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        product = serializer.validated_data['product']

        # First gate: stock check (stock decrement moves to webhook in Phase 4)
        if product.stock_quantity <= 0:
            return Response({'detail': 'This product is out of stock.'}, status=409)

        order = serializer.save(status='pending_payment')
        return Response({'order_id': order.id, 'order_reference': order.order_reference}, status=201)


class OrderRetrieveView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, order_reference):
        try:
            order = Order.objects.select_related('product').get(order_reference=order_reference)
        except Order.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=404)
        return Response(OrderSerializer(order).data)
