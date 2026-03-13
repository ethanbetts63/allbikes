from django.urls import path
from .views.order_views import OrderCreateView, OrderRetrieveView
from .views.admin_order_views import AdminOrderListView, AdminOrderDetailView, AdminOrderStatusView

app_name = 'shop'

urlpatterns = [
    path('orders/', OrderCreateView.as_view(), name='order-create'),
    path('orders/<str:order_reference>/', OrderRetrieveView.as_view(), name='order-detail'),
    path('admin/orders/', AdminOrderListView.as_view(), name='admin-order-list'),
    path('admin/orders/<int:pk>/', AdminOrderDetailView.as_view(), name='admin-order-detail'),
    path('admin/orders/<int:pk>/status/', AdminOrderStatusView.as_view(), name='admin-order-status'),
]
