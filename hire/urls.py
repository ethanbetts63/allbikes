from django.urls import path
from .views import (
    AdminHireSettingsView,
    AdminHireBookingListView,
    AdminHireBookingDetailView,
    AdminHireBookingStatusView,
    AdminHireExtraListView,
    AdminHireExtraDetailView,
    HireBikeListView,
    PublicHireSettingsView,
    HireExtrasListView,
    HireAvailabilityView,
    HireBookingCreateView,
    HireCreatePaymentIntentView,
    HireBookingRetrieveView,
)

app_name = 'hire'

urlpatterns = [
    path('bikes/', HireBikeListView.as_view(), name='hire-bike-list'),
    path('settings/', PublicHireSettingsView.as_view(), name='hire-settings-public'),
    path('extras/', HireExtrasListView.as_view(), name='hire-extras-list'),
    path('availability/', HireAvailabilityView.as_view(), name='hire-availability'),
    path('bookings/', HireBookingCreateView.as_view(), name='hire-booking-create'),
    path('bookings/<str:booking_reference>/', HireBookingRetrieveView.as_view(), name='hire-booking-detail'),
    path('create-payment-intent/', HireCreatePaymentIntentView.as_view(), name='hire-create-payment-intent'),
    path('admin/settings/', AdminHireSettingsView.as_view(), name='admin-hire-settings'),
    path('admin/bookings/', AdminHireBookingListView.as_view(), name='admin-hire-booking-list'),
    path('admin/bookings/<int:pk>/', AdminHireBookingDetailView.as_view(), name='admin-hire-booking-detail'),
    path('admin/bookings/<int:pk>/status/', AdminHireBookingStatusView.as_view(), name='admin-hire-booking-status'),
    path('admin/extras/', AdminHireExtraListView.as_view(), name='admin-hire-extras-list'),
    path('admin/extras/<int:pk>/', AdminHireExtraDetailView.as_view(), name='admin-hire-extras-detail'),
]
