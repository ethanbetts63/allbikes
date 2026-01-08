from django.urls import path
from .views.user_profile_view import UserProfileView
from .views.brand_list_view import BrandListView
from .views.terms_and_conditions_view import LatestTermsAndConditionsView

app_name = 'data_management'

urlpatterns = [
    path('me/', UserProfileView.as_view(), name='user-profile'),
    path('brands/', BrandListView.as_view(), name='brand-list'),
    path('terms/latest/', LatestTermsAndConditionsView.as_view(), name='latest-terms'),
]