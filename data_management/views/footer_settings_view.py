from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from ..models import SiteSettings
from ..serializers.footer_settings_serializer import FooterSettingsSerializer

class FooterSettingsView(APIView):
    """
    A view to return site settings relevant for the footer.
    """
    permission_classes = [AllowAny]

    def get(self, request, format=None):
        settings = SiteSettings.load()
        serializer = FooterSettingsSerializer(settings)
        return Response(serializer.data)