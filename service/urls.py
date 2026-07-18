from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views.booking_viewset import BookingViewSet
from .views.service_settings_view import ServiceSettingsViewSet
from .views.job_type_admin_view import JobTypeAdminViewSet
from .views.booking_request_log_admin_view import BookingRequestLogListView, BookingRequestLogDetailView
from .views.booking_admin_view import BookingAdminViewSet
from .views.blocked_date_view import BlockedDateViewSet

app_name = 'service_api'

# Router for admin viewsets
admin_router = DefaultRouter()
admin_router.register(r'job-types', JobTypeAdminViewSet, basename='job-type-admin')
admin_router.register(r'bookings', BookingAdminViewSet, basename='booking-admin')
admin_router.register(r'blocked-dates', BlockedDateViewSet, basename='blocked-date-admin')


# Manually map methods for the admin-only ServiceSettings singleton endpoint
service_settings_admin_view = ServiceSettingsViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update'
})

urlpatterns = [
    # Public booking APIs
    path('create-booking/', BookingViewSet.as_view({'post': 'create'}), name='create-booking'),
    path('job-types/', BookingViewSet.as_view({'get': 'job_types'}), name='job-types'),
    path('unavailable-days/', BookingViewSet.as_view({'get': 'unavailable_days'}), name='unavailable-days'),
    path('settings/', BookingViewSet.as_view({'get': 'fetch_service_config'}), name='get-settings'),

    # Admin APIs
    path('service-settings/', service_settings_admin_view, name='service-settings-admin'),
    path('admin/', include(admin_router.urls)),
    path('admin/booking-logs/', BookingRequestLogListView.as_view(), name='booking-log-list'),
    path('admin/booking-logs/<int:pk>/', BookingRequestLogDetailView.as_view(), name='booking-log-detail'),
]
