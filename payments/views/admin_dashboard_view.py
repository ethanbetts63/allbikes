from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser

from ..models import Order
from inventory.models import Motorcycle
from product.models import Product


class AdminDashboardView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        paid_orders = (
            Order.objects
            .filter(status='paid')
            .select_related('product', 'motorcycle')
            .order_by('created_at')
        )

        reserved_bikes = (
            Motorcycle.objects
            .filter(status='reserved')
            .order_by('-date_posted')
        )

        attention_products = (
            Product.objects
            .filter(is_active=True, stock_quantity__lte=Product.LOW_STOCK_THRESHOLD)
            .order_by('stock_quantity', 'name')
        )

        return Response({
            'paid_orders': [
                {
                    'id': o.id,
                    'order_reference': o.order_reference,
                    'payment_type': o.payment_type,
                    'customer_name': o.customer_name,
                    'created_at': o.created_at,
                }
                for o in paid_orders
            ],
            'reserved_bikes': [
                {
                    'id': m.id,
                    'slug': m.slug,
                    'make': m.make,
                    'model': m.model,
                    'year': m.year,
                }
                for m in reserved_bikes
            ],
            'attention_products': [
                {
                    'id': p.id,
                    'slug': p.slug,
                    'name': p.name,
                    'stock_quantity': p.stock_quantity,
                    'in_stock': p.in_stock,
                    'low_stock': p.low_stock,
                }
                for p in attention_products
            ],
        })
