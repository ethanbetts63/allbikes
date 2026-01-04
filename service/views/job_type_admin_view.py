from rest_framework import viewsets
from rest_framework.permissions import IsAdminUser
from ..models import JobType
from ..serializers import JobTypeSerializer

class JobTypeAdminViewSet(viewsets.ModelViewSet):
    """
    Admin ViewSet for managing JobType entries.
    Provides full CRUD functionality for administrators.
    """
    queryset = JobType.objects.all().order_by('name')
    serializer_class = JobTypeSerializer
    permission_classes = [IsAdminUser]
