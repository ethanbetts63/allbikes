from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from ..models import Motorcycle, MotorcycleImage
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
                image = MotorcycleImage.objects.get(id=image_id)
                if image.order != order:
                    image.order = order
                    image.save(update_fields=['order'])

        # Delete images that were not in the received list
        ids_to_delete = current_image_ids - received_image_ids
        if ids_to_delete:
            MotorcycleImage.objects.filter(id__in=ids_to_delete).delete()

        return Response(status=status.HTTP_204_NO_CONTENT)
