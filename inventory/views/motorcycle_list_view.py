from rest_framework.generics import ListAPIView
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny # Import AllowAny
from ..models import Motorcycle
from ..serializers import MotorcycleSerializer

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 12 # Default page size
    page_size_query_param = 'page_size' # Allow client to override the page size
    max_page_size = 100

class MotorcycleListView(ListAPIView):
    """
    API view to retrieve a list of motorcycles.
    Supports filtering by 'condition' and 'status'.
    Supports pagination.
    """
    serializer_class = MotorcycleSerializer
    pagination_class = StandardResultsSetPagination
    permission_classes = [AllowAny] # Make this endpoint public

    def get_queryset(self):
        """
        Optionally restricts the returned motorcycles by filtering against
        a `condition` query parameter in the URL. This now filters against
        the `name` field of the related MotorcycleCondition model.
        
        If the condition is not a valid choice (e.g., 'new', 'used'), all bikes are returned.
        """
        queryset = Motorcycle.objects.filter(status='for_sale').order_by('-date_posted')
        
        condition = self.request.query_params.get('condition')
        
        # Only filter if the condition is a valid, recognized value
        if condition in ['new', 'used']:
            if condition == 'used':
                # The "used" page should show both "used" and "demo" bikes
                queryset = queryset.filter(conditions__name__in=['used', 'demo'])
            else:
                # This handles 'new'
                queryset = queryset.filter(conditions__name__iexact=condition)
        
        return queryset
