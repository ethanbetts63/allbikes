from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from data_management.models import TermsAndConditions
from data_management.serializers.terms_and_conditions_serializer import TermsAndConditionsSerializer

class LatestTermsAndConditionsView(APIView):
    """
    Returns the most recent version of the Terms and Conditions.
    """
    permission_classes = [AllowAny]
    
    def get(self, request, *args, **kwargs):
        term_type = request.query_params.get('type')
        qs = TermsAndConditions.objects.all()
        if term_type:
            qs = qs.filter(term_type=term_type)
        else:
            qs = qs.order_by('-published_at')

        terms = qs.first()
        if not terms:
            return Response({"detail": "No Terms and Conditions found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = TermsAndConditionsSerializer(terms)
        return Response(serializer.data)