from rest_framework.generics import RetrieveAPIView
from rest_framework.permissions import AllowAny
from ..models import Motorcycle
from ..serializers import MotorcycleSerializer

class MotorcycleDetailView(RetrieveAPIView):
    """
    API view to retrieve a single motorcycle by its ID.
    """
    queryset = Motorcycle.objects.all()
    serializer_class = MotorcycleSerializer
    permission_classes = [AllowAny]
    lookup_field = 'pk'
