from django.urls import path
from .views.admin_notifications_view import AdminNotificationsView
from .views.webhook_view import StripeWebhookView
from .views.deposit_settings_views import DepositSettingsView, AdminDepositSettingsView

app_name = 'payments'

urlpatterns = [
    path('webhook/', StripeWebhookView.as_view(), name='stripe-webhook'),
    path('deposit-settings/', DepositSettingsView.as_view(), name='deposit-settings'),
    path('admin/notifications/', AdminNotificationsView.as_view(), name='admin-notifications'),
    path('admin/deposit-settings/', AdminDepositSettingsView.as_view(), name='admin-deposit-settings'),
]
