from rest_framework import generics
from rest_framework.permissions import AllowAny
from ..models import Brand
from ..serializers.brand_serializer import BrandSerializer

# Import caching decorators
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator

@method_decorator(cache_page(60 * 60 * 24), name='dispatch') # Cache for 24 hours
class BrandListView(generics.ListAPIView):
    """
    API view for listing all brands.
    """
    queryset = Brand.objects.all().order_by('name')
    serializer_class = BrandSerializer
    permission_classes = [AllowAny]
