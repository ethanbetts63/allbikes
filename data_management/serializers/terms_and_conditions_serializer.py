from rest_framework import serializers
from data_management.models import TermsAndConditions

class TermsAndConditionsSerializer(serializers.ModelSerializer):
    class Meta:
        model = TermsAndConditions
        fields = ['term_type', 'content', 'published_at']
