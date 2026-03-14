from rest_framework import serializers

from notifications.models import Message


class MessageListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['id', 'to', 'subject', 'message_type', 'channel', 'status', 'sent_at', 'created_at']


class MessageDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = [
            'id', 'to', 'subject', 'message_type', 'channel',
            'status', 'error_message', 'body_html', 'body_text',
            'sent_at', 'created_at',
        ]
