import stripe
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from ..utils.webhook_handlers import handle_payment_intent_succeeded, handle_payment_intent_failed


class StripeWebhookView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except (ValueError, stripe.error.SignatureVerificationError):
            return Response({'detail': 'Invalid signature.'}, status=400)

        event_type = event['type']
        payment_intent = event['data']['object']

        if event_type == 'payment_intent.succeeded':
            handle_payment_intent_succeeded(payment_intent)
        elif event_type == 'payment_intent.payment_failed':
            handle_payment_intent_failed(payment_intent)

        return Response({'status': 'ok'})
