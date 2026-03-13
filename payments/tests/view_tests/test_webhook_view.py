import json
import pytest
from unittest.mock import patch, MagicMock
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient


@pytest.fixture
def api_client():
    return APIClient()


def _build_event(event_type, payment_intent_id='pi_test'):
    return {
        'type': event_type,
        'data': {
            'object': {
                'id': payment_intent_id,
            }
        }
    }


@pytest.mark.django_db
class TestStripeWebhookView:
    """Tests for POST /api/shop/webhook/"""

    URL = None

    @pytest.fixture(autouse=True)
    def set_url(self):
        self.URL = reverse('payments:stripe-webhook')

    def test_invalid_signature_returns_400(self, api_client):
        """
        GIVEN a webhook request with an invalid Stripe signature
        WHEN posted
        THEN 400 Bad Request is returned.
        """
        import stripe
        with patch('payments.views.webhook_view.stripe.Webhook.construct_event') as mock_construct:
            mock_construct.side_effect = stripe.error.SignatureVerificationError('bad sig', 'sig_header')
            response = api_client.post(
                self.URL,
                data=json.dumps({'type': 'payment_intent.succeeded'}),
                content_type='application/json',
                HTTP_STRIPE_SIGNATURE='bad_sig',
            )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_payment_intent_succeeded_calls_handler(self, api_client):
        """
        GIVEN a valid payment_intent.succeeded webhook
        WHEN posted with a valid signature
        THEN the succeeded handler is called and 200 is returned.
        """
        event = _build_event('payment_intent.succeeded')
        with patch('payments.views.webhook_view.stripe.Webhook.construct_event', return_value=event), \
             patch('payments.views.webhook_view.handle_payment_intent_succeeded') as mock_handler:
            response = api_client.post(
                self.URL,
                data=json.dumps(event),
                content_type='application/json',
                HTTP_STRIPE_SIGNATURE='valid_sig',
            )
        assert response.status_code == status.HTTP_200_OK
        mock_handler.assert_called_once_with(event['data']['object'])

    def test_payment_intent_failed_calls_handler(self, api_client):
        """
        GIVEN a valid payment_intent.payment_failed webhook
        WHEN posted with a valid signature
        THEN the failed handler is called and 200 is returned.
        """
        event = _build_event('payment_intent.payment_failed')
        with patch('payments.views.webhook_view.stripe.Webhook.construct_event', return_value=event), \
             patch('payments.views.webhook_view.handle_payment_intent_failed') as mock_handler:
            response = api_client.post(
                self.URL,
                data=json.dumps(event),
                content_type='application/json',
                HTTP_STRIPE_SIGNATURE='valid_sig',
            )
        assert response.status_code == status.HTTP_200_OK
        mock_handler.assert_called_once_with(event['data']['object'])

    def test_unknown_event_type_is_ignored(self, api_client):
        """
        GIVEN a webhook for an event type we don't handle
        WHEN posted with a valid signature
        THEN 200 is returned without error.
        """
        event = _build_event('customer.created')
        with patch('payments.views.webhook_view.stripe.Webhook.construct_event', return_value=event):
            response = api_client.post(
                self.URL,
                data=json.dumps(event),
                content_type='application/json',
                HTTP_STRIPE_SIGNATURE='valid_sig',
            )
        assert response.status_code == status.HTTP_200_OK
