from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from data_management.models import TermsAndConditions
from data_management.serializers.terms_and_conditions_serializer import TermsAndConditionsSerializer

from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator

@method_decorator(cache_page(60 * 60 * 24), name='dispatch')
class LatestTermsAndConditionsView(APIView):
    """
    Returns the most recent version of the Terms and Conditions.
    """
    permission_classes = [AllowAny]
    
    def get(self, request, *args, **kwargs):
        latest_terms = TermsAndConditions.objects.order_by('-published_at').first()
        if not latest_terms:
            return Response({"detail": "No Terms and Conditions found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = TermsAndConditionsSerializer(latest_terms)
        return Response(serializer.data)
