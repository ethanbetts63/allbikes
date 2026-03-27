from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser

from ..models import HireSettings
from ..serializers import HireSettingsSerializer


class AdminHireSettingsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        settings = HireSettings.get()
        return Response(HireSettingsSerializer(settings).data)

    def patch(self, request):
        settings = HireSettings.get()
        serializer = HireSettingsSerializer(settings, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        serializer.save()
        return Response(serializer.data)
