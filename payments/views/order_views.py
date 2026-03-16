from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from ..models import Order
from ..serializers.order_serializer import OrderCreateSerializer, OrderSerializer


class OrderCreateView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OrderCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        data = serializer.validated_data

        if data.get('product'):
            product = data['product']
            if product.stock_quantity <= 0:
                return Response({'detail': 'This product is out of stock.'}, status=409)

        if data.get('motorcycle'):
            motorcycle = data['motorcycle']
            if motorcycle.status != 'for_sale':
                return Response({'detail': 'This motorcycle is not available for reservation.'}, status=409)
            # Deposits are always deposit payment type
            data['payment_type'] = 'deposit'

        order = serializer.save(status='pending_payment')
        return Response({'order_id': order.id, 'order_reference': order.order_reference}, status=201)


class OrderRetrieveView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request, order_reference):
        try:
            order = Order.objects.select_related('product', 'motorcycle').get(order_reference=order_reference)
        except Order.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=404)
        return Response(OrderSerializer(order).data)
