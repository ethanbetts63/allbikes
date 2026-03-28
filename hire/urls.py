from django.urls import path
from .views import (
    AdminHireSettingsView,
    AdminHireBookingListView,
    AdminHireBookingDetailView,
    AdminHireBookingStatusView,
    HireBikeListView,
    PublicHireSettingsView,
    HireAvailabilityView,
    HireBookingCreateView,
)

app_name = 'hire'

urlpatterns = [
    path('bikes/', HireBikeListView.as_view(), name='hire-bike-list'),
    path('settings/', PublicHireSettingsView.as_view(), name='hire-settings-public'),
    path('availability/', HireAvailabilityView.as_view(), name='hire-availability'),
    path('bookings/', HireBookingCreateView.as_view(), name='hire-booking-create'),
    path('admin/settings/', AdminHireSettingsView.as_view(), name='admin-hire-settings'),
    path('admin/bookings/', AdminHireBookingListView.as_view(), name='admin-hire-booking-list'),
    path('admin/bookings/<int:pk>/', AdminHireBookingDetailView.as_view(), name='admin-hire-booking-detail'),
    path('admin/bookings/<int:pk>/status/', AdminHireBookingStatusView.as_view(), name='admin-hire-booking-status'),
]
