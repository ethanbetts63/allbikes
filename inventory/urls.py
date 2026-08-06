from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views.motorcycle_viewset import MotorcycleViewSet
from .views.motorcycle_image_view import MotorcycleImageView
from .views.bike_order_views import (
    AdminBikeOrderDetailView,
    AdminBikeOrderListView,
    BikeOrderCreateView,
    BikeOrderDetailView,
    BikeOrderPaymentIntentView,
)
from .views.stock_alert_views import (
    AdminStockAlertSendView,
    AdminStockAlertView,
    StockAlertSubscribeView,
    StockAlertUnsubscribeView,
)

app_name = 'inventory'
router = DefaultRouter()
router.register(r'bikes', MotorcycleViewSet, basename='motorcycle')

urlpatterns = [
    path('stock-alerts/subscribe/', StockAlertSubscribeView.as_view(), name='stock-alert-subscribe'),
    path('stock-alerts/unsubscribe/<uuid:token>/', StockAlertUnsubscribeView.as_view(), name='stock-alert-unsubscribe'),
    path('admin/stock-alerts/', AdminStockAlertView.as_view(), name='admin-stock-alerts'),
    path('admin/stock-alerts/send/', AdminStockAlertSendView.as_view(), name='admin-stock-alert-send'),
    path('bike-orders/', BikeOrderCreateView.as_view(), name='bike-order-create'),
    path('bike-orders/<str:order_reference>/', BikeOrderDetailView.as_view(), name='bike-order-detail'),
    path('bike-orders/<str:order_reference>/payment-intent/', BikeOrderPaymentIntentView.as_view(), name='bike-order-payment-intent'),
    path('admin/bike-orders/', AdminBikeOrderListView.as_view(), name='admin-bike-order-list'),
    path('admin/bike-orders/<int:pk>/', AdminBikeOrderDetailView.as_view(), name='admin-bike-order-detail'),
    path('', include(router.urls)),
    path('bikes/<int:motorcycle_pk>/images/', MotorcycleImageView.as_view(), name='motorcycle-image-upload'),
]
