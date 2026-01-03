from rest_framework import viewsets, permissions
from rest_framework.pagination import PageNumberPagination
from ..models import Motorcycle
from ..serializers.motorcycle_serializer import MotorcycleSerializer

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 100

class MotorcycleViewSet(viewsets.ModelViewSet):
    """
    A ViewSet for viewing, creating, editing, and deleting motorcycles.

    Read-only access is public.
    Write access is restricted to admin users.
    """
    queryset = Motorcycle.objects.all().order_by('-date_posted')
    serializer_class = MotorcycleSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        """
        Optionally restricts the returned motorcycles to a given condition,
        by filtering against a `condition` query parameter in the URL.
        """
        queryset = Motorcycle.objects.all().order_by('-date_posted')
        condition = self.request.query_params.get('condition')
        if condition in ['new', 'used']:
            queryset = queryset.filter(condition=condition)
        return queryset

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        Allows public read-only access, but requires admin privileges for write operations.
        """
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [permissions.IsAdminUser]
        return [permission() for permission in permission_classes]
