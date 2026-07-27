from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from parts.models import PartsSettings
from parts.serializers.settings_serializers import PartsSettingsSerializer


class AdminPartsSettingsView(APIView):
    """Read and update the singleton pricing/shipping settings for SYM parts."""

    permission_classes = [IsAdminUser]

    def get(self, request):
        return Response(PartsSettingsSerializer(PartsSettings.get()).data)

    def patch(self, request):
        settings = PartsSettings.get()
        serializer = PartsSettingsSerializer(settings, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
