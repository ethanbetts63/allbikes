from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views.product_viewset import ProductViewSet
from .views.product_image_view import ProductImageView

app_name = "product"

router = DefaultRouter()
router.register(r"products", ProductViewSet, basename="product")

urlpatterns = [
    path("", include(router.urls)),
    path(
        "products/<int:product_pk>/images/",
        ProductImageView.as_view(),
        name="product-image-upload",
    ),
]
