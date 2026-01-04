from rest_framework import viewsets, mixins
from rest_framework.permissions import IsAdminUser
from ..models.service_settings import ServiceSettings
from ..serializers.service_settings_serializer import ServiceSettingsSerializer

class ServiceSettingsViewSet(
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet
):
    """
    A viewset for retrieving and updating the singleton ServiceSettings object.
    """
    queryset = ServiceSettings.objects.all()
    serializer_class = ServiceSettingsSerializer
    permission_classes = [IsAdminUser]

    def get_object(self):
        """
        Always return the singleton ServiceSettings instance.
        """
        return ServiceSettings.load()
