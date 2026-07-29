from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from hire.models import HireBooking
from inventory.models import BikeOrder, Motorcycle
from parts.models import PartsOrder
from product.models import Product, ProductOrder

PARTS_ORDER_SETTLED = ['completed', 'cancelled', 'refunded']


class AdminNotificationsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        product_orders = ProductOrder.objects.filter(status='paid').select_related('product').order_by('created_at')
        bike_orders = BikeOrder.objects.filter(status='paid').select_related('motorcycle').order_by('created_at')
        reserved_bikes = Motorcycle.objects.filter(status='reserved').order_by('-date_posted')
        attention_products = Product.objects.filter(
            is_active=True, stock_quantity__lte=Product.LOW_STOCK_THRESHOLD
        ).order_by('stock_quantity', 'name')
        active_hires = HireBooking.objects.filter(status__in=['confirmed', 'active']).select_related('motorcycle').order_by('hire_start')
        parts_orders = PartsOrder.objects.exclude(status__in=PARTS_ORDER_SETTLED).prefetch_related('items').order_by('created_at')

        return Response({
            'product_orders_to_action': [
                {'id': o.id, 'order_reference': o.order_reference, 'customer_name': o.customer_name,
                 'product_name': o.product.name, 'created_at': o.created_at}
                for o in product_orders
            ],
            'bike_orders_to_action': [
                {'id': o.id, 'order_reference': o.order_reference, 'customer_name': o.customer_name,
                 'motorcycle_name': str(o.motorcycle), 'created_at': o.created_at}
                for o in bike_orders
            ],
            'reserved_bikes': [
                {'id': m.id, 'slug': m.slug, 'make': m.make, 'model': m.model, 'year': m.year}
                for m in reserved_bikes
            ],
            'attention_products': [
                {'id': p.id, 'slug': p.slug, 'name': p.name, 'stock_quantity': p.stock_quantity,
                 'in_stock': p.in_stock, 'low_stock': p.low_stock}
                for p in attention_products
            ],
            'active_hire_bookings': [
                {'id': b.id, 'booking_reference': b.booking_reference, 'motorcycle_name': str(b.motorcycle),
                 'customer_name': b.customer_name, 'hire_start': b.hire_start, 'hire_end': b.hire_end,
                 'status': b.status}
                for b in active_hires
            ],
            'parts_orders_to_action': [
                {'id': o.id, 'order_reference': o.order_reference, 'customer_name': o.customer_name,
                 'status': o.status, 'has_backorder': o.has_backorder, 'item_count': len(o.items.all()),
                 'created_at': o.created_at}
                for o in parts_orders
            ],
        })
