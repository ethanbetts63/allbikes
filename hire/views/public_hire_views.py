import stripe
from datetime import date, datetime, timedelta
from decimal import Decimal

from django.conf import settings as django_settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from inventory.models import Motorcycle
from payments.models import Payment
from ..models import HireBooking, HireSettings
from ..serializers.hire_settings_serializer import HireSettingsSerializer
from ..serializers.hire_booking_serializer import HireBookingCreateSerializer
from ..utils.availability import is_motorcycle_available

stripe.api_key = django_settings.STRIPE_SECRET_KEY

STRIPE_MINIMUM = Decimal('0.50')


class PublicHireSettingsView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        settings = HireSettings.get()
        return Response(HireSettingsSerializer(settings).data)


class HireAvailabilityView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        motorcycle_id = request.query_params.get('motorcycle_id')
        try:
            motorcycle_id = int(motorcycle_id) if motorcycle_id else None
        except (ValueError, TypeError):
            return Response({'error': 'Invalid motorcycle_id.'}, status=400)
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')

        if not all([motorcycle_id, start_date_str, end_date_str]):
            return Response(
                {'error': 'motorcycle_id, start_date, and end_date are required.'},
                status=400,
            )

        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=400)

        gap_days = HireSettings.get().booking_gap_days
        return Response({'available': is_motorcycle_available(motorcycle_id, start_date, end_date, gap_days)})


class HireBookingCreateView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = HireBookingCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        data = serializer.validated_data
        motorcycle_id = data['motorcycle']
        hire_start = data['hire_start']
        hire_end = data['hire_end']
        customer_name = data['customer_name'].strip()
        customer_email = data['customer_email'].strip()
        customer_phone = data['customer_phone'].strip()

        hire_settings = HireSettings.get()
        today = date.today()

        if hire_start < today + timedelta(days=hire_settings.advance_min_days):
            return Response(
                {'error': f'Hire must start at least {hire_settings.advance_min_days} day(s) from today.'},
                status=400,
            )
        if hire_start > today + timedelta(days=hire_settings.advance_max_days):
            return Response(
                {'error': f'Hire cannot start more than {hire_settings.advance_max_days} days in advance.'},
                status=400,
            )
        if hire_end < hire_start:
            return Response({'error': 'Return date must be on or after the start date.'}, status=400)

        try:
            motorcycle = Motorcycle.objects.get(pk=motorcycle_id, is_hire=True)
        except Motorcycle.DoesNotExist:
            return Response({'error': 'Motorcycle not available for hire.'}, status=400)

        if motorcycle.status == 'on_hire':
            return Response({'error': 'This motorcycle is currently on hire.'}, status=400)

        if not is_motorcycle_available(motorcycle.id, hire_start, hire_end, hire_settings.booking_gap_days):
            return Response(
                {'error': 'This motorcycle is not available for the selected dates.'},
                status=400,
            )

        # Calculate effective daily rate (cheapest option)
        candidates = []
        if motorcycle.daily_rate and motorcycle.daily_rate > 0:
            candidates.append(motorcycle.daily_rate)
        if motorcycle.weekly_rate and motorcycle.weekly_rate > 0:
            candidates.append(motorcycle.weekly_rate / Decimal('7'))
        if motorcycle.monthly_rate and motorcycle.monthly_rate > 0:
            candidates.append(motorcycle.monthly_rate / Decimal('30'))

        if not candidates:
            return Response({'error': 'No hire rates configured for this motorcycle.'}, status=400)

        effective_daily_rate = min(candidates)
        num_days = (hire_end - hire_start).days + 1
        total_hire_amount = effective_daily_rate * num_days

        booking = HireBooking.objects.create(
            motorcycle=motorcycle,
            hire_start=hire_start,
            hire_end=hire_end,
            effective_daily_rate=round(effective_daily_rate, 2),
            total_hire_amount=round(total_hire_amount, 2),
            bond_amount=hire_settings.bond_amount,
            customer_name=customer_name,
            customer_email=customer_email,
            customer_phone=customer_phone,
            terms_accepted=True,
            is_of_age=True,
        )

        return Response(
            {
                'booking_id': booking.id,
                'booking_reference': booking.booking_reference,
                'motorcycle_name': str(motorcycle),
                'hire_start': str(hire_start),
                'hire_end': str(hire_end),
                'num_days': booking.num_days,
                'effective_daily_rate': str(booking.effective_daily_rate),
                'total_hire_amount': str(booking.total_hire_amount),
                'bond_amount': str(booking.bond_amount),
            },
            status=201,
        )


class HireCreatePaymentIntentView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        booking_id = request.data.get('booking_id')
        if not booking_id:
            return Response({'detail': 'booking_id is required.'}, status=400)

        try:
            booking = HireBooking.objects.get(pk=booking_id)
        except HireBooking.DoesNotExist:
            return Response({'detail': 'Booking not found.'}, status=404)

        if booking.status != 'pending_payment':
            return Response({'detail': 'Booking is not awaiting payment.'}, status=400)

        amount = max(booking.total_charged, STRIPE_MINIMUM)
        amount_cents = int(amount * 100)

        # Idempotency: reuse existing pending Payment if amount matches
        existing = Payment.objects.filter(hire_booking=booking, status='pending').first()
        if existing:
            if existing.amount == amount:
                intent = stripe.PaymentIntent.retrieve(existing.stripe_payment_intent_id)
                return Response({'clientSecret': intent.client_secret})
            else:
                stripe.PaymentIntent.cancel(existing.stripe_payment_intent_id)
                existing.delete()

        intent = stripe.PaymentIntent.create(
            amount=amount_cents,
            currency='aud',
            automatic_payment_methods={'enabled': True},
            metadata={
                'hire_booking_id': booking.id,
                'hire_booking_reference': booking.booking_reference,
            },
        )

        Payment.objects.create(
            hire_booking=booking,
            stripe_payment_intent_id=intent.id,
            amount=amount,
            status='pending',
        )

        return Response({'clientSecret': intent.client_secret})


class HireBookingRetrieveView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request, booking_reference):
        try:
            booking = HireBooking.objects.select_related('motorcycle').get(
                booking_reference=booking_reference
            )
        except HireBooking.DoesNotExist:
            return Response({'detail': 'Booking not found.'}, status=404)

        return Response({
            'booking_reference': booking.booking_reference,
            'motorcycle_name': str(booking.motorcycle),
            'hire_start': str(booking.hire_start),
            'hire_end': str(booking.hire_end),
            'num_days': booking.num_days,
            'effective_daily_rate': str(booking.effective_daily_rate),
            'total_hire_amount': str(booking.total_hire_amount),
            'bond_amount': str(booking.bond_amount),
            'status': booking.status,
        })
