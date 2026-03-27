from django.urls import path
from .views import (
    AdminHireSettingsView,
    AdminHireBookingListView,
    AdminHireBookingDetailView,
    AdminHireBookingStatusView,
)

app_name = 'hire'

urlpatterns = [
    path('admin/settings/', AdminHireSettingsView.as_view(), name='admin-hire-settings'),
    path('admin/bookings/', AdminHireBookingListView.as_view(), name='admin-hire-booking-list'),
    path('admin/bookings/<int:pk>/', AdminHireBookingDetailView.as_view(), name='admin-hire-booking-detail'),
    path('admin/bookings/<int:pk>/status/', AdminHireBookingStatusView.as_view(), name='admin-hire-booking-status'),
]
