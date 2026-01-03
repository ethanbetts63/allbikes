from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views.user_profile_view import UserProfileView
from .views.site_settings_view import SiteSettingsViewSet

app_name = 'data_management'

# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r'settings', SiteSettingsViewSet, basename='settings')

# The API URLs are now determined automatically by the router.
urlpatterns = [
    path('me/', UserProfileView.as_view(), name='user-profile'),
    path('', include(router.urls)),
]
