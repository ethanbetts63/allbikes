from unittest.mock import MagicMock, patch

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from hire.tests.factories.hire_booking_factory import HireBookingFactory
from payments.models import Payment
from payments.tests.factories.payment_factory import HirePaymentFactory


def _intent(client_secret='cs_test_hire', intent_id='pi_hire_test'):
    return MagicMock(id=intent_id, client_secret=client_secret)


pytestmark = pytest.mark.django_db


@pytest.fixture
def api_client():
    return APIClient()


class TestHireCreatePaymentIntentView:
    def url(self, booking):
        return reverse(
            'hire:hire-create-payment-intent', args=[booking.booking_reference]
        )

    def test_requires_access_token(self, api_client):
        booking = HireBookingFactory(status='pending_payment')
        response = api_client.post(self.url(booking), {}, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_wrong_token_does_not_reveal_booking(self, api_client):
        booking = HireBookingFactory(status='pending_payment')
        response = api_client.post(
            self.url(booking), {'access_token': 'wrong'}, format='json'
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_non_pending_booking_is_rejected(self, api_client):
        booking = HireBookingFactory(status='confirmed')
        response = api_client.post(
            self.url(booking), {'access_token': booking.access_token}, format='json'
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_creates_payment_for_matching_reference_and_token(self, api_client):
        booking = HireBookingFactory(status='pending_payment')
        with patch(
            'hire.views.public_hire_views.stripe.PaymentIntent.create',
            return_value=_intent('cs_hire_xyz', 'pi_hire_xyz'),
        ) as create:
            response = api_client.post(
                self.url(booking),
                {'access_token': booking.access_token},
                format='json',
            )

        assert response.status_code == status.HTTP_200_OK
        assert response.data['clientSecret'] == 'cs_hire_xyz'
        payment = Payment.objects.get(hire_booking=booking)
        assert payment.stripe_payment_intent_id == 'pi_hire_xyz'
        assert create.call_args.kwargs['metadata']['hire_booking_reference'] == booking.booking_reference

    def test_reuses_matching_pending_payment(self, api_client):
        booking = HireBookingFactory(
            status='pending_payment', total_hire_amount='400.00', bond_amount='500.00'
        )
        HirePaymentFactory(
            hire_booking=booking,
            stripe_payment_intent_id='pi_existing_hire',
            amount='400.00',
            status='pending',
        )
        with patch(
            'hire.views.public_hire_views.stripe.PaymentIntent.retrieve',
            return_value=_intent('cs_existing_hire', 'pi_existing_hire'),
        ), patch('hire.views.public_hire_views.stripe.PaymentIntent.create') as create:
            response = api_client.post(
                self.url(booking),
                {'access_token': booking.access_token},
                format='json',
            )

        assert response.data['clientSecret'] == 'cs_existing_hire'
        create.assert_not_called()
        assert Payment.objects.filter(hire_booking=booking).count() == 1


class TestHireBookingRetrieveView:
    def url(self, booking):
        return reverse('hire:hire-booking-detail', args=[booking.booking_reference])

    def test_requires_access_token_header(self, api_client):
        booking = HireBookingFactory()
        assert api_client.get(self.url(booking)).status_code == status.HTTP_403_FORBIDDEN

    def test_wrong_token_returns_404(self, api_client):
        booking = HireBookingFactory()
        response = api_client.get(self.url(booking), HTTP_X_BOOKING_TOKEN='wrong')
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_matching_token_returns_customer_safe_summary(self, api_client):
        booking = HireBookingFactory(status='confirmed')
        response = api_client.get(
            self.url(booking), HTTP_X_BOOKING_TOKEN=booking.access_token
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data['booking_reference'] == booking.booking_reference
        assert response.data['status'] == 'confirmed'
        assert 'access_token' not in response.data
        assert 'customer_email' not in response.data
