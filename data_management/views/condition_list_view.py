# allbikes/data_management/views/condition_list_view.py
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAdminUser
from inventory.models import MotorcycleCondition
from ..serializers.condition_serializer import MotorcycleConditionSerializer

class MotorcycleConditionListView(ListAPIView):
    """
    API view to retrieve a list of all available motorcycle conditions.
    Restricted to admin users.
    """
    queryset = MotorcycleCondition.objects.all().order_by('display_name')
    serializer_class = MotorcycleConditionSerializer
    permission_classes = [IsAdminUser]
