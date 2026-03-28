from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from inventory.models import Motorcycle
from inventory.serializers.motorcycle_serializer import MotorcycleSerializer


class HireBikeListView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        bikes = (
            Motorcycle.objects
            .filter(is_hire=True)
            .exclude(status='on_hire')
            .prefetch_related('images')
            .order_by('make', 'model')
        )
        return Response(MotorcycleSerializer(bikes, many=True).data)
