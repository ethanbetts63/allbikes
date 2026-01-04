from rest_framework.routers import DefaultRouter
from .views.booking_viewset import BookingViewSet

app_name = 'service_api'

router = DefaultRouter()
router.register(r'booking', BookingViewSet, basename='booking')

urlpatterns = router.urls