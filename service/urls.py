from django.urls import path
from .views.booking_viewset import BookingViewSet

app_name = 'service_api'

urlpatterns = [
    # Maps POST to the 'create' action. The frontend expects this specific path.
    path('create-booking/', BookingViewSet.as_view({'post': 'create'}), name='create-booking'),
    
    # Manually map paths to the custom @action methods in the ViewSet
    path('job-types/', BookingViewSet.as_view({'get': 'job_types'}), name='job-types'),
    path('unavailable-days/', BookingViewSet.as_view({'get': 'unavailable_days'}), name='unavailable-days'),
    path('settings/', BookingViewSet.as_view({'get': 'get_service_settings'}), name='get-settings'),
]