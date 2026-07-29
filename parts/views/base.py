from rest_framework.permissions import AllowAny
from rest_framework.views import APIView


class PublicAPIView(APIView):
    """Parts endpoint with no session/JWT authentication or permissions."""

    authentication_classes = []
    permission_classes = [AllowAny]
