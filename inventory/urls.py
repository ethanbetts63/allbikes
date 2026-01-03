from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views.motorcycle_viewset import MotorcycleViewSet
from .views.motorcycle_image_view import MotorcycleImageView

app_name = 'inventory'

# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r'bikes', MotorcycleViewSet, basename='motorcycle')

# The API URLs are now determined automatically by the router.
urlpatterns = [
    path('', include(router.urls)),
    path('bikes/<int:motorcycle_pk>/images/', MotorcycleImageView.as_view(), name='motorcycle-image-upload'),
]
