from django.db import transaction
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from ..models import Motorcycle, MotorcycleImage
from ..serializers.motorcycle_serializer import MotorcycleSerializer

# Import caching decorators
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 100

@method_decorator(cache_page(60 * 60 * 24), name='dispatch') # Cache for 24 hours
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
        Optionally restricts the returned motorcycles by condition, featured status,
        and applies ordering and filtering, by using query parameters in the URL.
        """
        queryset = Motorcycle.objects.all()
        
        # Filtering by condition
        condition = self.request.query_params.get('condition')
        if condition in ['new', 'used', 'demo']:
            queryset = queryset.filter(condition=condition)
            
        # Filtering by featured status
        is_featured = self.request.query_params.get('is_featured')
        if is_featured and is_featured.lower() == 'true':
            queryset = queryset.filter(is_featured=True)

        # Range filtering
        for param, lookup in [
            ('min_price', 'price__gte'),
            ('max_price', 'price__lte'),
            ('min_year', 'year__gte'),
            ('max_year', 'year__lte'),
            ('min_engine_size', 'engine_size__gte'),
            ('max_engine_size', 'engine_size__lte'),
        ]:
            value = self.request.query_params.get(param)
            if value is not None:
                try:
                    # For numeric fields, convert the value to an integer or float
                    numeric_value = float(value)
                    queryset = queryset.filter(**{lookup: numeric_value})
                except (ValueError, TypeError):
                    # Silently ignore invalid filter values
                    pass

        # Ordering logic
        ordering = self.request.query_params.get('ordering')
        if ordering:
            ordering_map = {
                'price_asc': 'price',
                'price_desc': '-price',
                'year_asc': 'year',
                'year_desc': '-year',
                'engine_size_asc': 'engine_size',
                'engine_size_desc': '-engine_size',
            }
            ordering_field = ordering_map.get(ordering)
            if ordering_field:
                queryset = queryset.order_by(ordering_field)
            else:
                queryset = queryset.order_by('-date_posted')
        else:
            queryset = queryset.order_by('-date_posted')
            
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
        
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def manage_images(self, request, pk=None):
        """
        Manage the order and existence of a motorcycle's images.
        Receives a list of image data, updates orders, and deletes images not in the list.
        """
        motorcycle = self.get_object()
        images_data = request.data
        
        if not isinstance(images_data, list):
            return Response({"error": "Expected a list of image objects."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                current_image_ids = {img.id for img in motorcycle.images.all()}
                received_image_ids = set()

                # Update orders for existing images
                for item in images_data:
                    image_id = item.get('id')
                    order = item.get('order')
                    
                    if image_id is None or order is None:
                        return Response({"error": "Each image object must have 'id' and 'order'."}, status=status.HTTP_400_BAD_REQUEST)

                    try:
                        image_id = int(image_id)
                    except (ValueError, TypeError):
                        return Response({"error": f"Invalid image ID: {image_id}"}, status=status.HTTP_400_BAD_REQUEST)

                    if image_id in current_image_ids:
                        received_image_ids.add(image_id)
                        # Use select_for_update to lock the row
                        image = MotorcycleImage.objects.select_for_update().get(id=image_id)
                        if image.order != order:
                            image.order = order
                            image.save(update_fields=['order'])

                # Delete images that were not in the received list
                ids_to_delete = current_image_ids - received_image_ids
                if ids_to_delete:
                    MotorcycleImage.objects.filter(id__in=ids_to_delete).delete()

        except Exception as e:
            # You might want to log the exception e
            return Response({"error": "An internal error occurred during image management."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(status=status.HTTP_204_NO_CONTENT)
