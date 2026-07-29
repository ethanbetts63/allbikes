"""Admin parts-order management (IsAdminUser)."""
from decimal import Decimal

from django.db.models import Case, IntegerField, Q, Value, When
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.serializers import EmailField, ValidationError
from rest_framework.views import APIView

from notifications.utils.email import send_parts_customer_update, send_parts_supplier_dispatch
from parts.models import Part, PartsOrder, PartsOrderItem, PartsSettings
from parts.serializers.admin_order_serializers import (
    AdminPartsOrderDetailSerializer,
    AdminPartsOrderListSerializer,
    AdminPartsOrderUpdateSerializer,
    supplier_price_map,
)

ITEM_ACTIONS = {'place_backorder', 'remove_backorder', 'mark_refunded', 'mark_to_order'}

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


def _get_order_or_404(order_reference):
    try:
        return PartsOrder.objects.prefetch_related('items').get(order_reference=order_reference)
    except PartsOrder.DoesNotExist:
        return None


def _supplier_email_draft(order):
    """Build the operator-editable supplier email from current PA feed prices."""
    prices = Part.objects.in_bulk(
        [item.part_number for item in order.items.all()], field_name='part_number'
    )
    rows = []
    total = Decimal('0.00')
    for item in order.items.all():
        part = prices.get(item.part_number)
        unit_price = part.wholesale_price_incl_gst if part else None
        line_total = unit_price * item.quantity if unit_price is not None else None
        gross_profit = item.line_total - line_total if line_total is not None else None
        if line_total is not None:
            total += line_total
        rows.append({
            'part_number': item.part_number,
            'description': item.description,
            'model_name': item.model_name,
            'model_code': item.model_code,
            'section_code': item.section_code,
            'ref_number': item.ref_number,
            'quantity': item.quantity,
            'unit_price': unit_price,
            'line_total': line_total,
            'customer_unit_price': item.unit_price,
            'customer_line_total': item.line_total,
            'gross_profit': gross_profit,
        })

    part_count = sum(row['quantity'] for row in rows)

    address_lines = [order.customer_name, order.address_line1]
    if order.address_line2:
        address_lines.append(order.address_line2)
    address_lines += [f'{order.suburb} {order.state} {order.postcode}', order.country]
    if order.customer_phone:
        address_lines.append(f'Phone: {order.customer_phone}')

    item_lines = []
    for position, row in enumerate(rows, start=1):
        unit = f"${row['unit_price']:.2f}" if row['unit_price'] is not None else 'Price unavailable'
        line = f"${row['line_total']:.2f}" if row['line_total'] is not None else 'Price unavailable'
        context = []
        if row['model_name']:
            model = row['model_name']
            if row['model_code']:
                model += f" ({row['model_code']})"
            context.append(f"Model: {model}")
        if row['section_code']:
            section = f"Section: {row['section_code']}"
            if row['ref_number']:
                section += f" · Ref {row['ref_number']}"
            context.append(section)
        context_line = f"   {' · '.join(context)}\n" if context else ''
        item_lines.append(
            f"{position}. {row['part_number']} — {row['description']}\n"
            f"{context_line}"
            f"   Quantity: {row['quantity']} × {unit} = {line}"
        )

    location = ' '.join(part for part in [order.suburb, order.state] if part)
    subject = f'SYM parts order {order.order_reference}' + (f' — {location}' if location else '')
    hold_days = PartsSettings.get().backorder_hold_days
    hold_period = f"{hold_days} {'day' if hold_days == 1 else 'days'}"
    body = (
        'Hello,\n\n'
        f'Please arrange the following {part_count} SYM parts to be shipped directly to:\n\n'
        + '\n'.join(address_lines)
        + '\n\nPARTS REQUIRED\n'
        + '\n\n'.join(item_lines)
        + f'\n\nSupplier parts total (incl. GST): ${total:.2f}\n\n'
        'If you cannot fulfil the order in full with current stock, please do not ship any part of the order. '
        'Please let us know which parts are missing and an ETA for when they are expected back in stock.\n\n'
        f'Parts that cannot be obtained within {hold_period} will be removed from the customer’s order. '
        'We will then resubmit an amended order to you.\n\n'
        'Regards,\nScooterShop\nadmin@scootershop.com.au'
    )
    return {
        'to': '',  # Never prefill a third-party recipient.
        'subject': subject,
        'body': body,
        'items': rows,
        'supplier_parts_total': total,
        'customer_parts_total': sum(row['customer_line_total'] for row in rows),
        'gross_profit_total': sum((row['gross_profit'] or Decimal('0.00')) for row in rows),
        'has_unpriced_items': any(row['unit_price'] is None for row in rows),
    }


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

    def get(self, request, order_reference):
        try:
            order = PartsOrder.objects.prefetch_related('items').select_related('payment').get(
                order_reference=order_reference
            )
        except PartsOrder.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=404)
        return Response(AdminPartsOrderDetailSerializer(order, context=_admin_order_context(order)).data)

    def patch(self, request, order_reference):
        try:
            order = PartsOrder.objects.get(order_reference=order_reference)
        except PartsOrder.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=404)
        serializer = AdminPartsOrderUpdateSerializer(order, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        serializer.save()
        order = PartsOrder.objects.prefetch_related('items').select_related('payment').get(pk=order.pk)
        return Response(AdminPartsOrderDetailSerializer(order, context=_admin_order_context(order)).data)


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
            if item.parts_order.backorder_window_expired():
                return Response(
                    {'detail': 'The backorder window has already closed for this order. '
                               'Refund this line instead.'},
                    status=400,
                )
            item.backordered = True
            item.status = 'to_order'
        elif action == 'remove_backorder':
            item.backordered = False
        elif action == 'mark_refunded':
            item.status = 'refunded'
            item.backordered = False
        elif action == 'mark_to_order':
            item.status = 'to_order'

        item.save()
        order = item.parts_order
        order.recompute_rollup()

        order = PartsOrder.objects.prefetch_related('items').select_related('payment').get(pk=order.pk)
        return Response(AdminPartsOrderDetailSerializer(order, context=_admin_order_context(order)).data)


def _admin_order_context(order):
    # Resolve supplier prices once per request so the item serializer doesn't
    # hit the DB per line.
    return {
        'backorder_hold_days': PartsSettings.get().backorder_hold_days,
        'supplier_prices': supplier_price_map(order),
        'order_status': order.status,
    }


class AdminPartsSupplierEmailView(APIView):
    """Preview and send an operator-reviewed supplier dispatch email.

    The recipient is intentionally never supplied by the server.  A staff member
    must enter it on the compose screen before a third-party email can be sent.
    """
    permission_classes = [IsAdminUser]

    def get(self, request, order_reference):
        order = _get_order_or_404(order_reference)
        if not order:
            return Response({'detail': 'Order not found.'}, status=404)
        if order.status != 'paid':
            return Response({'detail': 'Supplier emails are only available for paid orders.'}, status=400)
        return Response(_supplier_email_draft(order))

    def post(self, request, order_reference):
        order = _get_order_or_404(order_reference)
        if not order:
            return Response({'detail': 'Order not found.'}, status=404)
        if order.status != 'paid':
            return Response({'detail': 'Supplier emails are only available for paid orders.'}, status=400)

        try:
            to = EmailField().run_validation((request.data.get('to') or '').strip())
        except ValidationError:
            return Response({'to': ['Enter a valid supplier email address.']}, status=400)

        subject = (request.data.get('subject') or '').strip()
        body = (request.data.get('body') or '').strip()
        if not subject or not body:
            return Response({'detail': 'Subject and email body are required.'}, status=400)

        sent = send_parts_supplier_dispatch(order, to=to, subject=subject, text_body=body)
        if not sent:
            return Response({'detail': 'Email could not be sent. The failed attempt was recorded.'}, status=502)
        return Response({'detail': 'Supplier email sent.'})


class AdminPartsCustomerUpdateView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, order_reference):
        order = _get_order_or_404(order_reference)
        if not order:
            return Response({'detail': 'Order not found.'}, status=404)
        update_type = request.data.get('type')
        if update_type not in {'backorder', 'refund', 'arranged'}:
            return Response({'detail': 'Invalid customer update type.'}, status=400)
        if update_type == 'backorder' and not order.items.filter(backordered=True).exists():
            return Response({'detail': 'No order items are currently on backorder.'}, status=400)
        # "Order arranged" tells the customer every part is available. That is
        # untrue while any line is still held on backorder.
        if update_type == 'arranged' and order.items.filter(backordered=True).exists():
            return Response(
                {'detail': 'One or more items are still on backorder. Resolve or refund them '
                           'before telling the customer the order has been arranged.'},
                status=400,
            )
        if update_type == 'refund' and not order.items.filter(status='refunded').exists():
            return Response({'detail': 'No order items are marked refunded.'}, status=400)
        sent = send_parts_customer_update(order, update_type, backorder_days=PartsSettings.get().backorder_hold_days)
        if not sent:
            return Response({'detail': 'Customer update could not be sent. The failed attempt was recorded.'}, status=502)
        return Response({'detail': 'Customer update sent.'})
