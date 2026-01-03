from django.urls import path
from .views.user_profile_view import UserProfileView
from .views.site_settings_view import SiteSettingsViewSet
from .views.footer_settings_view import FooterSettingsView

app_name = 'data_management'

# Manually define the view for the singleton SiteSettings endpoint.
# .as_view() maps HTTP methods to the ViewSet's actions.
settings_view = SiteSettingsViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update'
})

urlpatterns = [
    path('me/', UserProfileView.as_view(), name='user-profile'),
    path('settings/', settings_view, name='site-settings'),
    path('footer-settings/', FooterSettingsView.as_view(), name='footer-settings'),
]