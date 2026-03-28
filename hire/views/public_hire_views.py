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

        overlapping = HireBooking.objects.filter(
            motorcycle_id=motorcycle_id,
            hire_start__lte=end_date,
            hire_end__gte=start_date,
        ).exclude(status='cancelled').exists()

        return Response({'available': not overlapping})


class HireBookingCreateView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data

        motorcycle_id = data.get('motorcycle')
        hire_start_str = data.get('hire_start')
        hire_end_str = data.get('hire_end')
        customer_name = (data.get('customer_name') or '').strip()
        customer_email = (data.get('customer_email') or '').strip()
        customer_phone = (data.get('customer_phone') or '').strip()

        if not all([motorcycle_id, hire_start_str, hire_end_str, customer_name, customer_email, customer_phone]):
            return Response({'error': 'All fields are required.'}, status=400)

        try:
            hire_start = datetime.strptime(hire_start_str, '%Y-%m-%d').date()
            hire_end = datetime.strptime(hire_end_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=400)

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

        overlapping = HireBooking.objects.filter(
            motorcycle=motorcycle,
            hire_start__lte=hire_end,
            hire_end__gte=hire_start,
        ).exclude(status='cancelled').exists()

        if overlapping:
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
        )

        motorcycle_name = (
            f"{motorcycle.year} {motorcycle.make} {motorcycle.model}"
            if motorcycle.year
            else f"{motorcycle.make} {motorcycle.model}"
        ).strip()

        return Response(
            {
                'booking_id': booking.id,
                'booking_reference': booking.booking_reference,
                'motorcycle_name': motorcycle_name,
                'hire_start': str(hire_start),
                'hire_end': str(hire_end),
                'num_days': num_days,
                'effective_daily_rate': str(round(effective_daily_rate, 2)),
                'total_hire_amount': str(round(total_hire_amount, 2)),
                'bond_amount': str(hire_settings.bond_amount),
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

        amount = max(booking.total_hire_amount + booking.bond_amount, STRIPE_MINIMUM)
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

        motorcycle = booking.motorcycle
        motorcycle_name = (
            f"{motorcycle.year} {motorcycle.make} {motorcycle.model}"
            if motorcycle.year
            else f"{motorcycle.make} {motorcycle.model}"
        ).strip()

        num_days = (booking.hire_end - booking.hire_start).days + 1

        return Response({
            'booking_reference': booking.booking_reference,
            'motorcycle_name': motorcycle_name,
            'hire_start': str(booking.hire_start),
            'hire_end': str(booking.hire_end),
            'num_days': num_days,
            'effective_daily_rate': str(booking.effective_daily_rate),
            'total_hire_amount': str(booking.total_hire_amount),
            'bond_amount': str(booking.bond_amount),
            'status': booking.status,
        })
