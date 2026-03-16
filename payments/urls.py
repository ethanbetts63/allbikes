from django.urls import path
from .views.order_views import OrderCreateView, OrderRetrieveView
from .views.admin_order_views import AdminOrderListView, AdminOrderDetailView, AdminOrderStatusView
from .views.admin_dashboard_view import AdminDashboardView
from .views.create_payment_intent_view import CreatePaymentIntentView
from .views.webhook_view import StripeWebhookView
from .views.deposit_settings_views import DepositSettingsView, AdminDepositSettingsView

app_name = 'payments'

urlpatterns = [
    path('orders/', OrderCreateView.as_view(), name='order-create'),
    path('orders/<str:order_reference>/', OrderRetrieveView.as_view(), name='order-detail'),
    path('create-payment-intent/', CreatePaymentIntentView.as_view(), name='create-payment-intent'),
    path('webhook/', StripeWebhookView.as_view(), name='stripe-webhook'),
    path('deposit-settings/', DepositSettingsView.as_view(), name='deposit-settings'),
    path('admin/dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),
    path('admin/orders/', AdminOrderListView.as_view(), name='admin-order-list'),
    path('admin/orders/<int:pk>/', AdminOrderDetailView.as_view(), name='admin-order-detail'),
    path('admin/orders/<int:pk>/status/', AdminOrderStatusView.as_view(), name='admin-order-status'),
    path('admin/deposit-settings/', AdminDepositSettingsView.as_view(), name='admin-deposit-settings'),
]
