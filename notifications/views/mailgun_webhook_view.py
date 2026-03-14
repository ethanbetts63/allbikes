import hashlib
import hmac
import logging
import time

from django.conf import settings
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from notifications.models import Message

logger = logging.getLogger(__name__)

# Reject webhooks with a timestamp more than 5 minutes old to prevent replay attacks.
MAX_TIMESTAMP_AGE_SECONDS = 300


def _verify_signature(signing_key, token, timestamp, signature):
    digest = hmac.new(
        signing_key.encode('utf-8'),
        msg=f"{timestamp}{token}".encode('utf-8'),
        digestmod=hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(digest, signature)


class MailgunWebhookView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        signing_key = getattr(settings, 'MAILGUN_WEBHOOK_SIGNING_KEY', None)
        if not signing_key:
            logger.error("MAILGUN_WEBHOOK_SIGNING_KEY is not configured.")
            return Response(status=500)

        signature_data = request.data.get('signature', {})
        token = signature_data.get('token', '')
        timestamp = signature_data.get('timestamp', '')
        signature = signature_data.get('signature', '')

        if not all([token, timestamp, signature]):
            return Response({'detail': 'Missing signature fields.'}, status=400)

        # Reject stale webhooks
        try:
            if abs(time.time() - float(timestamp)) > MAX_TIMESTAMP_AGE_SECONDS:
                return Response({'detail': 'Timestamp too old.'}, status=400)
        except (ValueError, TypeError):
            return Response({'detail': 'Invalid timestamp.'}, status=400)

        if not _verify_signature(signing_key, token, timestamp, signature):
            return Response({'detail': 'Invalid signature.'}, status=403)

        event_data = request.data.get('event-data', {})
        event_type = event_data.get('event')
        recipient = event_data.get('recipient', '')

        if event_type == 'delivered':
            Message.objects.filter(to=recipient, status='sent').update(status='delivered')

        elif event_type == 'failed':
            severity = event_data.get('severity')
            if severity == 'permanent':
                Message.objects.filter(to=recipient, status__in=['sent', 'delivered']).update(status='bounced')
                logger.warning("Permanent delivery failure for %s: %s", recipient, event_data.get('delivery-status', {}).get('message', ''))

        elif event_type in ('unsubscribed', 'complained'):
            logger.warning("Mailgun %s event for %s", event_type, recipient)

        return Response(status=200)
