import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from notifications.tests.factories.notification_factory import MessageFactory
from data_management.tests.factories.user_factory import UserFactory


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def admin_client():
    client = APIClient()
    user = UserFactory(is_staff=True, is_superuser=True)
    client.force_authenticate(user=user)
    return client


@pytest.mark.django_db
class TestMessageListView:
    """Tests for GET /api/notifications/messages/"""

    URL = None

    @pytest.fixture(autouse=True)
    def set_url(self):
        self.URL = reverse('notifications:message-list')

    def test_anonymous_user_is_rejected(self, api_client):
        """
        GIVEN an unauthenticated request
        WHEN GET /messages/
        THEN 401 is returned.
        """
        response = api_client.get(self.URL)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_non_admin_is_rejected(self, api_client):
        """
        GIVEN a non-staff authenticated user
        WHEN GET /messages/
        THEN 403 is returned.
        """
        user = UserFactory(is_staff=False)
        api_client.force_authenticate(user=user)
        response = api_client.get(self.URL)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_can_list_messages(self, admin_client):
        """
        GIVEN two existing messages
        WHEN an admin GETs /messages/
        THEN 200 is returned with both messages.
        """
        MessageFactory.create_batch(2)
        response = admin_client.get(self.URL)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 2

    def test_response_includes_expected_fields(self, admin_client):
        """
        GIVEN an existing message
        WHEN listed
        THEN the response includes list-level fields and not detail-only fields.
        """
        MessageFactory()
        response = admin_client.get(self.URL)
        result = response.data['results'][0]
        assert 'id' in result
        assert 'to' in result
        assert 'subject' in result
        assert 'message_type' in result
        assert 'channel' in result
        assert 'status' in result
        assert 'sent_at' in result
        assert 'body_html' not in result
        assert 'body_text' not in result

    def test_filter_by_channel(self, admin_client):
        """
        GIVEN messages with different channels
        WHEN filtered by channel=email
        THEN only email messages are returned.
        """
        MessageFactory(channel='email')
        MessageFactory(channel='sms')
        response = admin_client.get(self.URL, {'channel': 'email'})
        assert response.data['count'] == 1
        assert response.data['results'][0]['channel'] == 'email'

    def test_filter_by_status(self, admin_client):
        """
        GIVEN messages with different statuses
        WHEN filtered by status=failed
        THEN only failed messages are returned.
        """
        MessageFactory(status='sent')
        MessageFactory(status='failed')
        response = admin_client.get(self.URL, {'status': 'failed'})
        assert response.data['count'] == 1
        assert response.data['results'][0]['status'] == 'failed'

    def test_filter_by_message_type(self, admin_client):
        """
        GIVEN messages with different types
        WHEN filtered by message_type=admin_reminder
        THEN only admin_reminder messages are returned.
        """
        MessageFactory(message_type='customer_confirmation')
        MessageFactory(message_type='admin_reminder')
        response = admin_client.get(self.URL, {'message_type': 'admin_reminder'})
        assert response.data['count'] == 1
        assert response.data['results'][0]['message_type'] == 'admin_reminder'


@pytest.mark.django_db
class TestMessageDetailView:
    """Tests for GET /api/notifications/messages/<pk>/"""

    def _url(self, pk):
        return reverse('notifications:message-detail', kwargs={'pk': pk})

    def test_anonymous_user_is_rejected(self, api_client):
        """
        GIVEN an unauthenticated request
        WHEN GET /messages/<pk>/
        THEN 401 is returned.
        """
        msg = MessageFactory()
        response = api_client.get(self._url(msg.pk))
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_non_admin_is_rejected(self, api_client):
        """
        GIVEN a non-staff user
        WHEN GET /messages/<pk>/
        THEN 403 is returned.
        """
        user = UserFactory(is_staff=False)
        api_client.force_authenticate(user=user)
        msg = MessageFactory()
        response = api_client.get(self._url(msg.pk))
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_can_retrieve_message(self, admin_client):
        """
        GIVEN an existing message
        WHEN an admin GETs /messages/<pk>/
        THEN 200 is returned with the full message.
        """
        msg = MessageFactory(body_html='<p>hello</p>', body_text='hello')
        response = admin_client.get(self._url(msg.pk))
        assert response.status_code == status.HTTP_200_OK
        assert response.data['id'] == msg.pk

    def test_response_includes_detail_fields(self, admin_client):
        """
        GIVEN an existing message
        WHEN retrieved
        THEN the response includes body_html, body_text, and error_message.
        """
        msg = MessageFactory(body_html='<p>hello</p>', body_text='hello', error_message='')
        response = admin_client.get(self._url(msg.pk))
        assert 'body_html' in response.data
        assert 'body_text' in response.data
        assert 'error_message' in response.data

    def test_unknown_pk_returns_404(self, admin_client):
        """
        GIVEN a pk that does not exist
        WHEN retrieved
        THEN 404 is returned.
        """
        response = admin_client.get(self._url(99999))
        assert response.status_code == status.HTTP_404_NOT_FOUND
