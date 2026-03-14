from rest_framework import serializers

from notifications.models import SentMessage


class SentMessageListSerializer(serializers.ModelSerializer):
    class Meta:
        model = SentMessage
        fields = ['id', 'to', 'subject', 'message_type', 'channel', 'status', 'sent_at', 'created_at']


class SentMessageDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = SentMessage
        fields = [
            'id', 'to', 'subject', 'message_type', 'channel',
            'status', 'error_message', 'body_html', 'body_text',
            'sent_at', 'created_at',
        ]
