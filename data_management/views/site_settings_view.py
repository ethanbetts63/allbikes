from rest_framework import viewsets, mixins
from rest_framework.permissions import IsAdminUser, AllowAny
from ..models import SiteSettings
from ..serializers.site_settings_serializer import SiteSettingsSerializer
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator

@method_decorator(cache_page(60 * 60 * 24), name='dispatch') # Cache for 24 hours
class SiteSettingsViewSet(
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet
):
    """
    A viewset for retrieving and updating the singleton SiteSettings object.
    """
    queryset = SiteSettings.objects.all()
    serializer_class = SiteSettingsSerializer
    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        Allows public read-only access, but requires admin privileges for write operations.
        """
        if self.action == 'retrieve':
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAdminUser]
        return [permission() for permission in permission_classes]

    def get_object(self):
        """
        Always return the singleton SiteSettings instance.
        """
        return SiteSettings.load()