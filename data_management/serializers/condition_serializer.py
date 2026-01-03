# allbikes/data_management/serializers/condition_serializer.py
from rest_framework import serializers
from inventory.models import MotorcycleCondition

class MotorcycleConditionSerializer(serializers.ModelSerializer):
    class Meta:
        model = MotorcycleCondition
        fields = ['id', 'name', 'display_name']
