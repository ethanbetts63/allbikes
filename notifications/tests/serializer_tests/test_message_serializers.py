import pytest
from django.utils import timezone

from notifications.serializers import MessageListSerializer, MessageDetailSerializer
from notifications.tests.factories.notification_factory import MessageFactory


@pytest.mark.django_db
class TestMessageListSerializer:

    def test_includes_expected_fields(self):
        """
        GIVEN a Message instance
        WHEN serialized with MessageListSerializer
        THEN only list-level fields are present.
        """
        msg = MessageFactory()
        data = MessageListSerializer(msg).data
        expected = {'id', 'to', 'subject', 'message_type', 'channel', 'status', 'sent_at', 'created_at'}
        assert set(data.keys()) == expected

    def test_does_not_include_body_fields(self):
        """
        GIVEN a Message instance
        WHEN serialized with MessageListSerializer
        THEN body_html, body_text, and error_message are not exposed.
        """
        msg = MessageFactory()
        data = MessageListSerializer(msg).data
        assert 'body_html' not in data
        assert 'body_text' not in data
        assert 'error_message' not in data

    def test_values_match_model(self):
        """
        GIVEN a Message with known values
        WHEN serialized
        THEN the serialized values match the model fields.
        """
        msg = MessageFactory(
            to='check@example.com',
            subject='Check subject',
            message_type='admin_reminder',
            channel='email',
            status='sent',
        )
        data = MessageListSerializer(msg).data
        assert data['to'] == 'check@example.com'
        assert data['subject'] == 'Check subject'
        assert data['message_type'] == 'admin_reminder'
        assert data['channel'] == 'email'
        assert data['status'] == 'sent'


@pytest.mark.django_db
class TestMessageDetailSerializer:

    def test_includes_expected_fields(self):
        """
        GIVEN a Message instance
        WHEN serialized with MessageDetailSerializer
        THEN all detail fields are present.
        """
        msg = MessageFactory()
        data = MessageDetailSerializer(msg).data
        expected = {
            'id', 'to', 'subject', 'message_type', 'channel',
            'status', 'error_message', 'body_html', 'body_text',
            'sent_at', 'created_at',
        }
        assert set(data.keys()) == expected

    def test_body_fields_are_returned(self):
        """
        GIVEN a Message with HTML and text body
        WHEN serialized with MessageDetailSerializer
        THEN both bodies are returned.
        """
        msg = MessageFactory(body_html='<p>Hello</p>', body_text='Hello')
        data = MessageDetailSerializer(msg).data
        assert data['body_html'] == '<p>Hello</p>'
        assert data['body_text'] == 'Hello'

    def test_error_message_returned_for_failed(self):
        """
        GIVEN a failed Message with an error_message
        WHEN serialized
        THEN the error_message is present.
        """
        msg = MessageFactory(status='failed', error_message='Connection timeout', sent_at=None)
        data = MessageDetailSerializer(msg).data
        assert data['error_message'] == 'Connection timeout'
        assert data['status'] == 'failed'
