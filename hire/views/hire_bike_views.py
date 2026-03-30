from datetime import datetime

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from inventory.models import Motorcycle
from inventory.serializers.motorcycle_serializer import MotorcycleSerializer
from ..models import HireSettings
from ..utils.availability import get_unavailable_motorcycle_ids


class HireBikeListView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')

        bikes = (
            Motorcycle.objects
            .filter(is_hire=True)
            .prefetch_related('images')
            .order_by('make', 'model')
        )

        if start_date_str and end_date_str:
            try:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=400)

            gap_days = HireSettings.get().booking_gap_days
            bikes = bikes.exclude(id__in=get_unavailable_motorcycle_ids(start_date, end_date, gap_days))

        return Response(MotorcycleSerializer(bikes, many=True, context={'request': request}).data)
