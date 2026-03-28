import pytest
from unittest.mock import patch, MagicMock
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from payments.models import Payment
from hire.models import HireBooking
from hire.tests.factories.hire_booking_factory import HireBookingFactory
from payments.tests.factories.payment_factory import HirePaymentFactory


@pytest.fixture
def api_client():
    return APIClient()


def _mock_intent(client_secret='cs_test_hire', intent_id='pi_hire_test'):
    intent = MagicMock()
    intent.id = intent_id
    intent.client_secret = client_secret
    return intent


# ---------------------------------------------------------------------------
# Hire Create Payment Intent
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestHireCreatePaymentIntentView:

    URL = None

    @pytest.fixture(autouse=True)
    def set_url(self):
        self.URL = reverse('hire:hire-create-payment-intent')

    def test_missing_booking_id_returns_400(self, api_client):
        """
        GIVEN a request with no booking_id
        WHEN POST /api/hire/create-payment-intent/
        THEN 400 is returned.
        """
        response = api_client.post(self.URL, {}, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_unknown_booking_id_returns_404(self, api_client):
        """
        GIVEN a booking_id that does not exist
        WHEN POST /api/hire/create-payment-intent/
        THEN 404 is returned.
        """
        response = api_client.post(self.URL, {'booking_id': 99999}, format='json')
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_non_pending_booking_returns_400(self, api_client):
        """
        GIVEN a booking with status='confirmed' (already paid)
        WHEN POST /api/hire/create-payment-intent/
        THEN 400 is returned.
        """
        booking = HireBookingFactory(status='confirmed')
        response = api_client.post(self.URL, {'booking_id': booking.id}, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_creates_payment_intent_and_returns_client_secret(self, api_client):
        """
        GIVEN a pending_payment booking
        WHEN POST /api/hire/create-payment-intent/
        THEN a Payment record is created and clientSecret is returned.
        """
        booking = HireBookingFactory(status='pending_payment')
        with patch('hire.views.public_hire_views.stripe.PaymentIntent.create') as mock_create:
            mock_create.return_value = _mock_intent(client_secret='cs_hire_xyz', intent_id='pi_hire_xyz')
            response = api_client.post(self.URL, {'booking_id': booking.id}, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['clientSecret'] == 'cs_hire_xyz'
        assert Payment.objects.filter(hire_booking=booking, stripe_payment_intent_id='pi_hire_xyz').exists()

    def test_payment_record_has_pending_status(self, api_client):
        """
        GIVEN a pending_payment booking
        WHEN payment intent is created
        THEN the Payment record has status='pending'.
        """
        booking = HireBookingFactory(status='pending_payment')
        with patch('hire.views.public_hire_views.stripe.PaymentIntent.create') as mock_create:
            mock_create.return_value = _mock_intent()
            api_client.post(self.URL, {'booking_id': booking.id}, format='json')

        payment = Payment.objects.get(hire_booking=booking)
        assert payment.status == 'pending'

    def test_amount_is_hire_total_plus_bond(self, api_client):
        """
        GIVEN a booking with total_hire_amount=400 and bond_amount=500
        WHEN payment intent is created
        THEN Stripe is called with 900.00 * 100 = 90000 cents.
        """
        booking = HireBookingFactory(
            status='pending_payment',
            total_hire_amount='400.00',
            bond_amount='500.00',
        )
        with patch('hire.views.public_hire_views.stripe.PaymentIntent.create') as mock_create:
            mock_create.return_value = _mock_intent()
            api_client.post(self.URL, {'booking_id': booking.id}, format='json')

        called_amount = mock_create.call_args[1]['amount']
        assert called_amount == 90000  # 900.00 * 100

    def test_metadata_includes_hire_booking_id_and_reference(self, api_client):
        """
        GIVEN a pending_payment booking
        WHEN payment intent is created
        THEN the Stripe metadata contains hire_booking_id and hire_booking_reference.
        """
        booking = HireBookingFactory(status='pending_payment')
        with patch('hire.views.public_hire_views.stripe.PaymentIntent.create') as mock_create:
            mock_create.return_value = _mock_intent()
            api_client.post(self.URL, {'booking_id': booking.id}, format='json')

        metadata = mock_create.call_args[1]['metadata']
        assert metadata['hire_booking_id'] == booking.id
        assert metadata['hire_booking_reference'] == booking.booking_reference

    def test_reuses_existing_pending_payment_with_same_amount(self, api_client):
        """
        GIVEN a booking that already has a pending Payment for the same amount
        WHEN create-payment-intent is called again
        THEN no new Payment is created and the existing clientSecret is returned.
        """
        booking = HireBookingFactory(
            status='pending_payment',
            total_hire_amount='400.00',
            bond_amount='500.00',
        )
        HirePaymentFactory(
            hire_booking=booking,
            stripe_payment_intent_id='pi_existing_hire',
            amount='900.00',
            status='pending',
        )
        existing_intent = _mock_intent(client_secret='cs_existing_hire', intent_id='pi_existing_hire')

        with patch('hire.views.public_hire_views.stripe.PaymentIntent.retrieve') as mock_retrieve, \
             patch('hire.views.public_hire_views.stripe.PaymentIntent.create') as mock_create:
            mock_retrieve.return_value = existing_intent
            response = api_client.post(self.URL, {'booking_id': booking.id}, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['clientSecret'] == 'cs_existing_hire'
        mock_create.assert_not_called()
        assert Payment.objects.filter(hire_booking=booking).count() == 1

    def test_cancels_old_intent_when_amount_changes(self, api_client):
        """
        GIVEN a booking with an existing pending Payment at a different amount
        WHEN create-payment-intent is called
        THEN the old intent is cancelled and a new one is created.
        """
        booking = HireBookingFactory(
            status='pending_payment',
            total_hire_amount='400.00',
            bond_amount='500.00',
        )
        HirePaymentFactory(
            hire_booking=booking,
            stripe_payment_intent_id='pi_old_hire',
            amount='100.00',
            status='pending',
        )
        new_intent = _mock_intent(client_secret='cs_new_hire', intent_id='pi_new_hire')

        with patch('hire.views.public_hire_views.stripe.PaymentIntent.cancel') as mock_cancel, \
             patch('hire.views.public_hire_views.stripe.PaymentIntent.create') as mock_create:
            mock_create.return_value = new_intent
            response = api_client.post(self.URL, {'booking_id': booking.id}, format='json')

        assert response.status_code == status.HTTP_200_OK
        mock_cancel.assert_called_once_with('pi_old_hire')
        mock_create.assert_called_once()
        assert Payment.objects.filter(hire_booking=booking, stripe_payment_intent_id='pi_new_hire').exists()


# ---------------------------------------------------------------------------
# Hire Booking Retrieve
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestHireBookingRetrieveView:

    def test_returns_404_for_unknown_reference(self, api_client):
        """
        GIVEN no booking with the given reference
        WHEN GET /api/hire/bookings/HR-UNKNOWN/
        THEN 404 is returned.
        """
        url = reverse('hire:hire-booking-detail', kwargs={'booking_reference': 'HR-UNKNOWN'})
        response = api_client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_returns_booking_fields(self, api_client):
        """
        GIVEN an existing booking
        WHEN GET /api/hire/bookings/{reference}/
        THEN 200 and all expected fields are returned.
        """
        booking = HireBookingFactory()
        url = reverse('hire:hire-booking-detail', kwargs={'booking_reference': booking.booking_reference})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['booking_reference'] == booking.booking_reference
        assert 'motorcycle_name' in response.data
        assert 'hire_start' in response.data
        assert 'hire_end' in response.data
        assert 'num_days' in response.data
        assert 'effective_daily_rate' in response.data
        assert 'total_hire_amount' in response.data
        assert 'bond_amount' in response.data
        assert 'status' in response.data

    def test_returns_correct_status(self, api_client):
        """
        GIVEN a booking with status='confirmed'
        WHEN GET /api/hire/bookings/{reference}/
        THEN status='confirmed' is returned.
        """
        booking = HireBookingFactory(status='confirmed')
        url = reverse('hire:hire-booking-detail', kwargs={'booking_reference': booking.booking_reference})
        response = api_client.get(url)
        assert response.data['status'] == 'confirmed'

    def test_pending_payment_booking_returns_correct_status(self, api_client):
        """
        GIVEN a booking with status='pending_payment'
        WHEN GET /api/hire/bookings/{reference}/
        THEN status='pending_payment' is returned (used by polling page).
        """
        booking = HireBookingFactory(status='pending_payment')
        url = reverse('hire:hire-booking-detail', kwargs={'booking_reference': booking.booking_reference})
        response = api_client.get(url)
        assert response.data['status'] == 'pending_payment'
