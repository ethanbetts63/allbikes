from django.urls import path
from .views.user_profile_view import UserProfileView
from .views.condition_list_view import MotorcycleConditionListView

app_name = 'data_management'

urlpatterns = [
    path('me/', UserProfileView.as_view(), name='user-profile'),
    path('conditions/', MotorcycleConditionListView.as_view(), name='condition-list'),
]
