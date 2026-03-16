from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAdminUser

from ..models import DepositSettings
from ..serializers.deposit_settings_serializer import DepositSettingsSerializer


class DepositSettingsView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        settings = DepositSettings.get()
        return Response(DepositSettingsSerializer(settings).data)


class AdminDepositSettingsView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request):
        settings = DepositSettings.get()
        serializer = DepositSettingsSerializer(settings, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        serializer.save()
        return Response(serializer.data)
