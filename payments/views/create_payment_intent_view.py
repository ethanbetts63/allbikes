import stripe
from decimal import Decimal
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from ..models import Order, Payment, DepositSettings

stripe.api_key = settings.STRIPE_SECRET_KEY

STRIPE_MINIMUM = Decimal('0.50')


class CreatePaymentIntentView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        order_id = request.data.get('order_id')
        if not order_id:
            return Response({'detail': 'order_id is required.'}, status=400)

        try:
            order = Order.objects.select_related('product', 'motorcycle').get(pk=order_id)
        except Order.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=404)

        if order.status != 'pending_payment':
            return Response({'detail': 'Order is not awaiting payment.'}, status=400)

        # Determine amount — branch on payment type
        if order.payment_type == 'deposit':
            # Second gate: re-check motorcycle is still available
            if order.motorcycle.status != 'for_sale':
                return Response({'detail': 'This motorcycle is no longer available.'}, status=409)
            amount = max(DepositSettings.get().deposit_amount, STRIPE_MINIMUM)
        else:
            # Second gate: re-check product stock
            product = order.product
            if product.stock_quantity <= 0:
                return Response({'detail': 'This product is out of stock.'}, status=409)
            discount = product.discount_price
            price = discount if discount and discount > 0 else product.price
            amount = max(price, STRIPE_MINIMUM)

        amount_cents = int(amount * 100)

        # Idempotency: reuse existing pending Payment if amount matches
        existing = Payment.objects.filter(order=order, status='pending').first()
        if existing:
            if existing.amount == amount:
                intent = stripe.PaymentIntent.retrieve(existing.stripe_payment_intent_id)
                return Response({'clientSecret': intent.client_secret})
            else:
                # Amount changed — cancel old intent and create new
                stripe.PaymentIntent.cancel(existing.stripe_payment_intent_id)
                existing.delete()

        intent = stripe.PaymentIntent.create(
            amount=amount_cents,
            currency='aud',
            automatic_payment_methods={'enabled': True},
            metadata={'order_id': order.id, 'order_reference': order.order_reference},
        )

        Payment.objects.create(
            order=order,
            stripe_payment_intent_id=intent.id,
            amount=amount,
            status='pending',
        )

        return Response({'clientSecret': intent.client_secret})
