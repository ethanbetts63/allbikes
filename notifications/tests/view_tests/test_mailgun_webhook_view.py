import hashlib
import hmac
import time

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from notifications.models import Message
from notifications.tests.factories.notification_factory import MessageFactory

SIGNING_KEY = 'test-signing-key'
URL = '/api/notifications/webhooks/mailgun/'


def _sign(token, timestamp, key=SIGNING_KEY):
    """Generate a valid Mailgun HMAC-SHA256 signature."""
    digest = hmac.new(
        key.encode('utf-8'),
        msg=f"{timestamp}{token}".encode('utf-8'),
        digestmod=hashlib.sha256,
    ).hexdigest()
    return digest


def _payload(event_type, recipient='customer@example.com', severity=None, token='abc123', timestamp=None):
    """Build a minimal Mailgun webhook payload with a valid signature."""
    ts = str(timestamp or int(time.time()))
    sig = _sign(token, ts)
    event_data = {'event': event_type, 'recipient': recipient}
    if severity:
        event_data['severity'] = severity
    return {
        'signature': {'token': token, 'timestamp': ts, 'signature': sig},
        'event-data': event_data,
    }


@pytest.fixture
def api_client():
    return APIClient()


@pytest.mark.django_db
class TestMailgunWebhookView:
    """Tests for POST /api/notifications/webhooks/mailgun/"""

    # --- Security ---

    def test_missing_signing_key_returns_500(self, api_client, settings):
        """
        GIVEN MAILGUN_WEBHOOK_SIGNING_KEY is not configured
        WHEN a webhook is posted
        THEN 500 is returned.
        """
        settings.MAILGUN_WEBHOOK_SIGNING_KEY = None
        response = api_client.post(URL, _payload('delivered'), format='json')
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR

    def test_missing_signature_fields_returns_400(self, api_client, settings):
        """
        GIVEN a payload with no signature block
        WHEN posted
        THEN 400 is returned.
        """
        settings.MAILGUN_WEBHOOK_SIGNING_KEY = SIGNING_KEY
        response = api_client.post(URL, {'event-data': {'event': 'delivered'}}, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_invalid_signature_returns_403(self, api_client, settings):
        """
        GIVEN a payload with a tampered signature
        WHEN posted
        THEN 403 is returned.
        """
        settings.MAILGUN_WEBHOOK_SIGNING_KEY = SIGNING_KEY
        payload = _payload('delivered')
        payload['signature']['signature'] = 'invalidsignature'
        response = api_client.post(URL, payload, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_stale_timestamp_returns_400(self, api_client, settings):
        """
        GIVEN a payload with a timestamp older than 5 minutes
        WHEN posted
        THEN 400 is returned.
        """
        settings.MAILGUN_WEBHOOK_SIGNING_KEY = SIGNING_KEY
        old_timestamp = int(time.time()) - 400
        response = api_client.post(URL, _payload('delivered', timestamp=old_timestamp), format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_valid_signature_is_accepted(self, api_client, settings):
        """
        GIVEN a correctly signed payload
        WHEN posted
        THEN 200 is returned.
        """
        settings.MAILGUN_WEBHOOK_SIGNING_KEY = SIGNING_KEY
        response = api_client.post(URL, _payload('delivered'), format='json')
        assert response.status_code == status.HTTP_200_OK

    # --- delivered event ---

    def test_delivered_event_updates_message_status(self, api_client, settings):
        """
        GIVEN a 'sent' Message for a recipient
        WHEN a delivered webhook arrives for that recipient
        THEN the Message status is updated to 'delivered'.
        """
        settings.MAILGUN_WEBHOOK_SIGNING_KEY = SIGNING_KEY
        msg = MessageFactory(to='customer@example.com', status='sent')
        api_client.post(URL, _payload('delivered', recipient='customer@example.com'), format='json')
        msg.refresh_from_db()
        assert msg.status == 'delivered'

    def test_delivered_event_only_updates_sent_messages(self, api_client, settings):
        """
        GIVEN a 'failed' Message for a recipient
        WHEN a delivered webhook arrives
        THEN the failed Message is not changed.
        """
        settings.MAILGUN_WEBHOOK_SIGNING_KEY = SIGNING_KEY
        msg = MessageFactory(to='customer@example.com', status='failed')
        api_client.post(URL, _payload('delivered', recipient='customer@example.com'), format='json')
        msg.refresh_from_db()
        assert msg.status == 'failed'

    # --- failed event (permanent) ---

    def test_permanent_failure_updates_message_to_bounced(self, api_client, settings):
        """
        GIVEN a 'sent' Message for a recipient
        WHEN a failed/permanent webhook arrives
        THEN the Message status is updated to 'bounced'.
        """
        settings.MAILGUN_WEBHOOK_SIGNING_KEY = SIGNING_KEY
        msg = MessageFactory(to='bounce@example.com', status='sent')
        api_client.post(URL, _payload('failed', recipient='bounce@example.com', severity='permanent'), format='json')
        msg.refresh_from_db()
        assert msg.status == 'bounced'

    def test_permanent_failure_also_updates_delivered_messages(self, api_client, settings):
        """
        GIVEN a 'delivered' Message (e.g. previously confirmed delivered)
        WHEN a permanent failure webhook arrives for the same recipient
        THEN the Message status is updated to 'bounced'.
        """
        settings.MAILGUN_WEBHOOK_SIGNING_KEY = SIGNING_KEY
        msg = MessageFactory(to='bounce@example.com', status='delivered')
        api_client.post(URL, _payload('failed', recipient='bounce@example.com', severity='permanent'), format='json')
        msg.refresh_from_db()
        assert msg.status == 'bounced'

    def test_temporary_failure_does_not_update_message(self, api_client, settings):
        """
        GIVEN a 'sent' Message
        WHEN a failed/temporary webhook arrives (Mailgun will retry)
        THEN the Message status is unchanged.
        """
        settings.MAILGUN_WEBHOOK_SIGNING_KEY = SIGNING_KEY
        msg = MessageFactory(to='temp@example.com', status='sent')
        api_client.post(URL, _payload('failed', recipient='temp@example.com', severity='temporary'), format='json')
        msg.refresh_from_db()
        assert msg.status == 'sent'

    # --- unsubscribed / complained events ---

    def test_unsubscribed_event_is_accepted(self, api_client, settings):
        """
        GIVEN a valid unsubscribed event
        WHEN posted
        THEN 200 is returned and no exception is raised.
        """
        settings.MAILGUN_WEBHOOK_SIGNING_KEY = SIGNING_KEY
        response = api_client.post(URL, _payload('unsubscribed'), format='json')
        assert response.status_code == status.HTTP_200_OK

    def test_complained_event_is_accepted(self, api_client, settings):
        """
        GIVEN a valid complained event
        WHEN posted
        THEN 200 is returned and no exception is raised.
        """
        settings.MAILGUN_WEBHOOK_SIGNING_KEY = SIGNING_KEY
        response = api_client.post(URL, _payload('complained'), format='json')
        assert response.status_code == status.HTTP_200_OK

    def test_unknown_event_type_is_accepted(self, api_client, settings):
        """
        GIVEN a valid payload with an unrecognised event type
        WHEN posted
        THEN 200 is returned (forward-compatible, we just ignore it).
        """
        settings.MAILGUN_WEBHOOK_SIGNING_KEY = SIGNING_KEY
        response = api_client.post(URL, _payload('opened'), format='json')
        assert response.status_code == status.HTTP_200_OK
