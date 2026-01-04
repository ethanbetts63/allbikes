from django.urls import path
from .views.booking_api_views import (
    CreateBookingView,
    GetJobTypesView,
    GetUnavailableDaysView
)

app_name = 'service_api'

urlpatterns = [
    path('create-booking/', CreateBookingView.as_view(), name='create-booking'),
    path('job-types/', GetJobTypesView.as_view(), name='job-types'),
    path('unavailable-days/', GetUnavailableDaysView.as_view(), name='unavailable-days'),
]