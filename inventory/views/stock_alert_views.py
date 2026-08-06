from rest_framework import serializers
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from data_management.throttling import StockAlertSignupThrottle
from inventory.models import Motorcycle, StockAlertSubscriber
from inventory.stock_alerts import eligible_bikes, preview_data, queue_items, send_next_stock_alert


class SubscriptionSerializer(serializers.Serializer):
    email = serializers.EmailField()


def _subscriber_data(subscriber):
    return {
        'id': subscriber.id,
        'email': subscriber.email,
        'status': subscriber.status,
        'subscribed_at': subscriber.subscribed_at,
        'unsubscribed_at': subscriber.unsubscribed_at,
    }


def _included_bike_data(bike):
    price = bike.discount_price or bike.price
    return {
        'id': bike.id,
        'title': str(bike),
        'condition': bike.condition,
        'vehicle_type': bike.vehicle_type,
        'status': bike.status,
        'price_label': f'${price:,.0f}' if price is not None else 'Price on request',
        'listing_url': f'https://www.scootershop.com.au/inventory/motorcycles/{bike.slug}',
    }


class StockAlertSubscribeView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [StockAlertSignupThrottle]

    def post(self, request):
        serializer = SubscriptionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email'].strip().casefold()
        subscriber, created = StockAlertSubscriber.objects.get_or_create(email=email)
        if not created and subscriber.status != 'active':
            subscriber.status = 'active'
            subscriber.unsubscribed_at = None
            subscriber.save(update_fields=['status', 'unsubscribed_at', 'updated_at'])
        return Response({'detail': 'You are subscribed to motorcycle and scooter stock alerts.'}, status=201 if created else 200)


class StockAlertUnsubscribeView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get_subscriber(self, token):
        return StockAlertSubscriber.objects.filter(unsubscribe_token=token).first()

    def get(self, request, token):
        subscriber = self.get_subscriber(token)
        if not subscriber:
            return Response({'detail': 'This unsubscribe link is invalid.'}, status=404)
        return Response({'active': subscriber.status == 'active'})

    def post(self, request, token):
        subscriber = self.get_subscriber(token)
        if not subscriber:
            return Response({'detail': 'This unsubscribe link is invalid.'}, status=404)
        if subscriber.status == 'active':
            subscriber.unsubscribe()
        return Response({'detail': 'You have been unsubscribed from motorcycle and scooter stock alerts.'})


class AdminStockAlertView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        bikes = list(eligible_bikes())
        return Response({
            'subscribers': [_subscriber_data(subscriber) for subscriber in StockAlertSubscriber.objects.all()],
            'preview': preview_data(queue_items(bikes)),
            'included_bikes': [
                _included_bike_data(bike)
                for bike in bikes
            ],
        })


class AdminStockAlertSendView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        try:
            result = send_next_stock_alert()
        except ValueError as exc:
            return Response({'detail': str(exc)}, status=400)
        return Response(result, status=201)
