"""Admin parts-order management (IsAdminUser)."""
from datetime import date

from django.db.models import Case, IntegerField, Q, Value, When
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from parts.models import PartsOrder, PartsOrderItem
from parts.serializers.admin_order_serializers import (
    AdminPartsOrderDetailSerializer,
    AdminPartsOrderListSerializer,
    AdminPartsOrderUpdateSerializer,
)

ITEM_ACTIONS = {'place_backorder', 'remove_backorder', 'mark_fulfilled', 'mark_refunded', 'mark_ordered'}

# Default "to-do first" ordering: actionable statuses float to the top.
STATUS_PRIORITY = {
    'paid': 0,             # needs dispatch
    'dispatched': 1,       # in transit
    'partially_refunded': 2,
    'pending_payment': 3,
    'completed': 4,
    'refunded': 5,
    'cancelled': 6,
}
# Fields the list may be explicitly ordered by (via ?ordering=, optional '-').
ORDERABLE_FIELDS = {'created_at', 'total', 'customer_name', 'status'}


class AdminPartsOrderPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 200


class AdminPartsOrderListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        orders = PartsOrder.objects.prefetch_related('items')

        status_filter = request.query_params.get('status')
        if status_filter:
            statuses = [s.strip() for s in status_filter.split(',')]
            orders = orders.filter(status__in=statuses)

        if request.query_params.get('has_backorder') in ('1', 'true', 'True'):
            orders = orders.filter(has_backorder=True)

        q = (request.query_params.get('q') or '').strip()
        if q:
            orders = orders.filter(
                Q(order_reference__icontains=q)
                | Q(customer_email__icontains=q)
                | Q(customer_name__icontains=q)
            )

        orders = self._apply_ordering(orders, request.query_params.get('ordering'))
        paginator = AdminPartsOrderPagination()
        page = paginator.paginate_queryset(orders, request)
        return paginator.get_paginated_response(AdminPartsOrderListSerializer(page, many=True).data)

    @staticmethod
    def _status_priority_annotation():
        return Case(
            *[When(status=s, then=Value(p)) for s, p in STATUS_PRIORITY.items()],
            default=Value(99),
            output_field=IntegerField(),
        )

    def _apply_ordering(self, orders, ordering):
        """Order by ?ordering= (an ORDERABLE_FIELDS name, optionally '-'-prefixed).

        Falls back to the "to-do first" default. `status` sorts by the actionable
        priority above rather than alphabetically.
        """
        ordering = (ordering or '').strip()
        desc = ordering.startswith('-')
        field = ordering.lstrip('-')

        if field == 'status':
            orders = orders.annotate(_priority=self._status_priority_annotation())
            return orders.order_by('-_priority' if desc else '_priority', '-created_at')
        if field in ORDERABLE_FIELDS:
            secondary = () if field == 'created_at' else ('-created_at',)
            return orders.order_by(ordering, *secondary)

        # Default: actionable statuses first, newest within each group.
        orders = orders.annotate(_priority=self._status_priority_annotation())
        return orders.order_by('_priority', '-created_at')


class AdminPartsOrderDetailView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, pk):
        try:
            order = PartsOrder.objects.prefetch_related('items').select_related('payment').get(pk=pk)
        except PartsOrder.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=404)
        return Response(AdminPartsOrderDetailSerializer(order).data)

    def patch(self, request, pk):
        try:
            order = PartsOrder.objects.get(pk=pk)
        except PartsOrder.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=404)
        serializer = AdminPartsOrderUpdateSerializer(order, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        serializer.save()
        order = PartsOrder.objects.prefetch_related('items').select_related('payment').get(pk=pk)
        return Response(AdminPartsOrderDetailSerializer(order).data)


class AdminPartsOrderItemView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        try:
            item = PartsOrderItem.objects.select_related('parts_order').get(pk=pk)
        except PartsOrderItem.DoesNotExist:
            return Response({'detail': 'Item not found.'}, status=404)

        action = request.data.get('action')
        if action not in ITEM_ACTIONS:
            return Response({'detail': f'action must be one of {sorted(ITEM_ACTIONS)}.'}, status=400)

        if action == 'place_backorder':
            item.backordered = True
            if not item.backorder_since:
                item.backorder_since = date.today()
            item.status = 'ordered'
        elif action == 'remove_backorder':
            item.backordered = False
            item.backorder_since = None
        elif action == 'mark_fulfilled':
            item.status = 'fulfilled'
            item.backordered = False
        elif action == 'mark_refunded':
            item.status = 'refunded'
            item.backordered = False
        elif action == 'mark_ordered':
            item.status = 'ordered'

        item.save()
        order = item.parts_order
        order.recompute_rollup()

        order = PartsOrder.objects.prefetch_related('items').select_related('payment').get(pk=order.pk)
        return Response(AdminPartsOrderDetailSerializer(order).data)
