from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from ..models import HireBlockedDate
from ..serializers.hire_blocked_date_serializer import HireBlockedDateSerializer


class HireBlockedDatesPublicView(APIView):
    """Returns global blocked date ranges (shop closures) for the frontend date picker."""
    permission_classes = [AllowAny]

    def get(self, request):
        blocked = HireBlockedDate.objects.filter(motorcycle__isnull=True)
        return Response(HireBlockedDateSerializer(blocked, many=True).data)
