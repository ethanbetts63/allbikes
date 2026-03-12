from django.urls import path
from .views.user_profile_view import UserProfileView
from .views.terms_and_conditions_view import LatestTermsAndConditionsView

app_name = 'data_management'

urlpatterns = [
    path('me/', UserProfileView.as_view(), name='user-profile'),
    path('terms/latest/', LatestTermsAndConditionsView.as_view(), name='latest-terms'),
]