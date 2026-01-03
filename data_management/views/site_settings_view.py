from rest_framework import viewsets, mixins
from rest_framework.permissions import IsAdminUser
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
    permission_classes = [IsAdminUser]

    def get_object(self):
        """
        Always return the singleton SiteSettings instance.
        """
        return SiteSettings.load()
