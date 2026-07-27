from django.db import transaction
from django.db.models import Case, When, Value, IntegerField, Q
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from ..models import Motorcycle, MotorcycleImage
from ..serializers.motorcycle_serializer import MotorcycleSerializer

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 9
    page_size_query_param = 'page_size'
    max_page_size = 100

class MotorcycleViewSet(viewsets.ModelViewSet):
    """
    A ViewSet for viewing, creating, editing, and deleting motorcycles.

    Read-only access is public.
    Write access is restricted to admin users.
    """
    queryset = Motorcycle.objects.prefetch_related('images').order_by('-popular', '-date_posted')
    serializer_class = MotorcycleSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        """
        Optionally restricts the returned motorcycles by condition,
        and applies ordering and filtering, by using query parameters in the URL.
        """
        queryset = Motorcycle.objects.prefetch_related('images')
        
        # Filtering by condition (supports comma-separated values e.g. "new,demo")
        condition = self.request.query_params.get('condition')
        if condition:
            valid = {'new', 'used', 'demo', 'parts'}
            conditions = [c for c in condition.split(',') if c in valid]
            if conditions:
                queryset = queryset.filter(condition__in=conditions)

        vehicle_type = self.request.query_params.get('vehicle_type')
        if vehicle_type:
            valid_vehicle_types = {'motorcycle', 'scooter'}
            vehicle_types = [v for v in vehicle_type.split(',') if v in valid_vehicle_types]
            if vehicle_types:
                queryset = queryset.filter(vehicle_type__in=vehicle_types)

        status_filter = self.request.query_params.get('status')
        if status_filter:
            valid_statuses = {choice[0] for choice in Motorcycle.STATUS_CHOICES}
            statuses = [value for value in status_filter.split(',') if value in valid_statuses]
            if statuses:
                queryset = queryset.filter(status__in=statuses)

        search = (self.request.query_params.get('search') or '').strip()
        if search:
            queryset = queryset.filter(
                Q(make__icontains=search)
                | Q(model__icontains=search)
                | Q(stock_number__icontains=search)
                | Q(rego__icontains=search)
                | Q(vin__icontains=search)
            )

        make = (self.request.query_params.get('make') or '').strip()
        if make:
            queryset = queryset.filter(make__iexact=make)
            
        # Filtering by hire availability
        is_hire = self.request.query_params.get('is_hire')
        if is_hire and is_hire.lower() == 'true':
            queryset = queryset.filter(is_hire=True)

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
                'make_asc': 'make',
                'make_desc': '-make',
                'model_asc': 'model',
                'model_desc': '-model',
                'condition_asc': 'condition',
                'condition_desc': '-condition',
                'vehicle_type_asc': 'vehicle_type',
                'vehicle_type_desc': '-vehicle_type',
                'status_asc': 'status',
                'status_desc': '-status',
                'date_posted_asc': 'date_posted',
                'date_posted_desc': '-date_posted',
            }
            ordering_field = ordering_map.get(ordering)
            if ordering_field:
                queryset = queryset.order_by(ordering_field)
            else:
                queryset = queryset.order_by('-date_posted')
        else:
            # Default sort: for-sale bikes first, sold bikes last, everything
            # else in between; within each group, popular then newest.
            queryset = queryset.annotate(
                status_rank=Case(
                    When(status='for_sale', then=Value(0)),
                    When(status='sold', then=Value(2)),
                    default=Value(1),
                    output_field=IntegerField(),
                )
            ).order_by('status_rank', '-popular', '-date_posted')

        return queryset

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny], pagination_class=None)
    def makes(self, request):
        """Return the distinct makes available for the supplied inventory category."""
        unique_makes = {}
        for make in self.get_queryset().values_list('make', flat=True):
            normalized_make = make.strip()
            if normalized_make:
                key = normalized_make.casefold()
                whitespace_score = int(make != normalized_make)
                existing = unique_makes.get(key)
                if existing is None or whitespace_score < existing[1]:
                    unique_makes[key] = (normalized_make, whitespace_score)

        makes = [make for make, _ in unique_makes.values()]
        return Response(sorted(makes, key=str.casefold))

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        Allows public read-only access, but requires admin privileges for write operations.
        """
        if self.action in ['list', 'retrieve', 'makes']:
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
