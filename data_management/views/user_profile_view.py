from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from ..serializers.user_profile_serializer import UserProfileSerializer

class UserProfileView(APIView):
    """
    API view for retrieving the authenticated user's profile.
    Accessed via `/api/data-management/me/`.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Return the profile of the currently authenticated user.
        """
        user = request.user
        serializer = UserProfileSerializer(user)
        return Response(serializer.data)
