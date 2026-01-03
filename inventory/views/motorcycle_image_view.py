from rest_framework import views, permissions, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from ..models import Motorcycle, MotorcycleImage
from ..serializers.motorcycle_image_serializer import MotorcycleImageSerializer

class MotorcycleImageView(views.APIView):
    """
    A view for uploading images to a specific motorcycle.
    """
    permission_classes = [permissions.IsAdminUser]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, motorcycle_pk=None):
        """
        Handle the POST request to upload an image.
        """
        motorcycle = get_object_or_404(Motorcycle, pk=motorcycle_pk)
        
        # The serializer expects 'image' data in request.data
        serializer = MotorcycleImageSerializer(data=request.data)
        
        if serializer.is_valid():
            # If valid, save the new image instance, associating it with the motorcycle
            serializer.save(motorcycle=motorcycle)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
