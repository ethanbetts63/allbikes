from rest_framework import serializers
from ..models import FAQ

class FaqSerializer(serializers.ModelSerializer):
    class Meta:
        model = FAQ
        fields = ['id', 'question', 'answer', 'pages']
