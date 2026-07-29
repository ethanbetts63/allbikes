from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views.product_viewset import ProductViewSet
from .views.product_image_view import ProductImageView
from .views.product_order_views import (
    AdminProductOrderDetailView,
    AdminProductOrderListView,
    ProductOrderCreateView,
    ProductOrderDetailView,
    ProductOrderPaymentIntentView,
)

app_name = "product"

router = DefaultRouter()
router.register(r"products", ProductViewSet, basename="product")

urlpatterns = [
    path('orders/', ProductOrderCreateView.as_view(), name='order-create'),
    path('orders/<str:order_reference>/', ProductOrderDetailView.as_view(), name='order-detail'),
    path('orders/<str:order_reference>/payment-intent/', ProductOrderPaymentIntentView.as_view(), name='order-payment-intent'),
    path('admin/orders/', AdminProductOrderListView.as_view(), name='admin-order-list'),
    path('admin/orders/<int:pk>/', AdminProductOrderDetailView.as_view(), name='admin-order-detail'),
    path("", include(router.urls)),
    path(
        "products/<int:product_pk>/images/",
        ProductImageView.as_view(),
        name="product-image-upload",
    ),
]
