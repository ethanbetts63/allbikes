from rest_framework import generics
from rest_framework.permissions import AllowAny
from ..models import Brand
from ..serializers.brand_serializer import BrandSerializer

class BrandListView(generics.ListAPIView):
    """
    API view for listing all brands.
    """
    queryset = Brand.objects.all().order_by('name')
    serializer_class = BrandSerializer
    permission_classes = [AllowAny]
