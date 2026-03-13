from django.db import transaction
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from ..models import Product, ProductImage
from ..serializers.product_serializer import ProductSerializer


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = "page_size"
    max_page_size = 100


class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        user = self.request.user
        if user and user.is_authenticated and user.is_staff:
            qs = Product.objects.all()
        else:
            qs = Product.objects.filter(is_active=True)

        if self.request.query_params.get('is_featured') == 'true':
            qs = qs.filter(is_featured=True)

        return qs.order_by("-created_at")

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAdminUser])
    def manage_images(self, request, pk=None):
        product = self.get_object()
        images_data = request.data

        if not isinstance(images_data, list):
            return Response(
                {"error": "Expected a list of image objects."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            with transaction.atomic():
                current_image_ids = {img.id for img in product.images.all()}
                received_image_ids = set()

                for item in images_data:
                    image_id = item.get("id")
                    order = item.get("order")

                    if image_id is None or order is None:
                        return Response(
                            {"error": "Each image object must have 'id' and 'order'."},
                            status=status.HTTP_400_BAD_REQUEST,
                        )

                    try:
                        image_id = int(image_id)
                    except (ValueError, TypeError):
                        return Response(
                            {"error": f"Invalid image ID: {image_id}"},
                            status=status.HTTP_400_BAD_REQUEST,
                        )

                    if image_id in current_image_ids:
                        received_image_ids.add(image_id)
                        image = ProductImage.objects.select_for_update().get(id=image_id)
                        if image.order != order:
                            image.order = order
                            image.save(update_fields=["order"])

                ids_to_delete = current_image_ids - received_image_ids
                if ids_to_delete:
                    ProductImage.objects.filter(id__in=ids_to_delete).delete()

        except Exception:
            return Response(
                {"error": "An internal error occurred during image management."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(status=status.HTTP_204_NO_CONTENT)
