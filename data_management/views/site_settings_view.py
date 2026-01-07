from rest_framework import viewsets, mixins
from rest_framework.permissions import IsAdminUser, AllowAny
from ..models import SiteSettings
from ..serializers.site_settings_serializer import SiteSettingsSerializer

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