from django.urls import path
from .views.user_profile_view import UserProfileView

app_name = 'data_management'

urlpatterns = [
    path('me/', UserProfileView.as_view(), name='user-profile'),
]
