from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser

from ..models import Order
from ..serializers.order_serializer import OrderSerializer, OrderStatusSerializer


class AdminOrderListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        status_filter = request.query_params.get('status')
        orders = Order.objects.select_related('product').order_by('-created_at')
        if status_filter:
            statuses = [s.strip() for s in status_filter.split(',')]
            orders = orders.filter(status__in=statuses)
        return Response(OrderSerializer(orders, many=True).data)


class AdminOrderDetailView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, pk):
        try:
            order = Order.objects.select_related('product').get(pk=pk)
        except Order.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=404)
        return Response(OrderSerializer(order).data)


class AdminOrderStatusView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=404)
        serializer = OrderStatusSerializer(order, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        serializer.save()
        return Response(serializer.data)
