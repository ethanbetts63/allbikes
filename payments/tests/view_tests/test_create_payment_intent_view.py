import pytest
from unittest.mock import patch, MagicMock
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from payments.models import Payment
from payments.tests.factories.order_factory import OrderFactory
from payments.tests.factories.payment_factory import PaymentFactory
from product.tests.factories.product_factory import ProductFactory
from data_management.tests.factories.user_factory import UserFactory


@pytest.fixture
def api_client():
    return APIClient()


def _mock_intent(client_secret='cs_test_abc', intent_id='pi_test_abc'):
    intent = MagicMock()
    intent.id = intent_id
    intent.client_secret = client_secret
    return intent


@pytest.mark.django_db
class TestCreatePaymentIntentView:
    """Tests for POST /api/shop/create-payment-intent/"""

    URL = None

    @pytest.fixture(autouse=True)
    def set_url(self):
        self.URL = reverse('payments:create-payment-intent')

    # --- Auth / access ---

    def test_anonymous_user_can_access(self, api_client):
        """
        GIVEN a valid pending_payment order
        WHEN an anonymous user posts to create-payment-intent
        THEN the request is not rejected due to authentication (AllowAny).
        """
        order = OrderFactory(status='pending_payment')
        with patch('payments.views.create_payment_intent_view.stripe.PaymentIntent.create') as mock_create:
            mock_create.return_value = _mock_intent()
            response = api_client.post(self.URL, {'order_id': order.id}, format='json')
        assert response.status_code != status.HTTP_401_UNAUTHORIZED
        assert response.status_code != status.HTTP_403_FORBIDDEN

    # --- Validation ---

    def test_missing_order_id_returns_400(self, api_client):
        """
        GIVEN a request with no order_id
        WHEN posted
        THEN 400 Bad Request is returned.
        """
        response = api_client.post(self.URL, {}, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_unknown_order_id_returns_404(self, api_client):
        """
        GIVEN a request with an order_id that doesn't exist
        WHEN posted
        THEN 404 Not Found is returned.
        """
        response = api_client.post(self.URL, {'order_id': 99999}, format='json')
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_non_pending_payment_order_returns_400(self, api_client):
        """
        GIVEN an order that is already paid
        WHEN posted
        THEN 400 Bad Request is returned.
        """
        order = OrderFactory(status='paid')
        response = api_client.post(self.URL, {'order_id': order.id}, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_out_of_stock_returns_409(self, api_client):
        """
        GIVEN a pending_payment order whose product has 0 stock (sold out between order and payment)
        WHEN posted
        THEN 409 Conflict is returned.
        """
        product = ProductFactory(stock_quantity=0)
        order = OrderFactory(status='pending_payment', product=product)
        response = api_client.post(self.URL, {'order_id': order.id}, format='json')
        assert response.status_code == status.HTTP_409_CONFLICT

    # --- Happy path ---

    def test_creates_payment_intent_and_returns_client_secret(self, api_client):
        """
        GIVEN a valid pending_payment order with stock
        WHEN posted
        THEN a Payment record is created and clientSecret is returned.
        """
        order = OrderFactory(status='pending_payment')
        with patch('payments.views.create_payment_intent_view.stripe.PaymentIntent.create') as mock_create:
            mock_create.return_value = _mock_intent(client_secret='cs_test_xyz', intent_id='pi_test_xyz')
            response = api_client.post(self.URL, {'order_id': order.id}, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['clientSecret'] == 'cs_test_xyz'
        assert Payment.objects.filter(order=order, stripe_payment_intent_id='pi_test_xyz').exists()

    def test_payment_is_created_with_pending_status(self, api_client):
        """
        GIVEN a valid order
        WHEN payment intent is created
        THEN the Payment record has status 'pending'.
        """
        order = OrderFactory(status='pending_payment')
        with patch('payments.views.create_payment_intent_view.stripe.PaymentIntent.create') as mock_create:
            mock_create.return_value = _mock_intent()
            api_client.post(self.URL, {'order_id': order.id}, format='json')

        payment = Payment.objects.get(order=order)
        assert payment.status == 'pending'

    def test_uses_discount_price_when_set(self, api_client):
        """
        GIVEN a product with discount_price=800 (< regular price)
        WHEN payment intent is created
        THEN Stripe is called with the discounted amount (in cents).
        """
        product = ProductFactory(price='1500.00', discount_price='800.00', stock_quantity=5)
        order = OrderFactory(status='pending_payment', product=product)
        with patch('payments.views.create_payment_intent_view.stripe.PaymentIntent.create') as mock_create:
            mock_create.return_value = _mock_intent()
            api_client.post(self.URL, {'order_id': order.id}, format='json')

        called_amount = mock_create.call_args[1]['amount']
        assert called_amount == 80000  # 800.00 * 100

    def test_uses_regular_price_when_no_discount(self, api_client):
        """
        GIVEN a product with price=1200 and no discount_price
        WHEN payment intent is created
        THEN Stripe is called with 1200.00 in cents.
        """
        product = ProductFactory(price='1200.00', discount_price=None, stock_quantity=5)
        order = OrderFactory(status='pending_payment', product=product)
        with patch('payments.views.create_payment_intent_view.stripe.PaymentIntent.create') as mock_create:
            mock_create.return_value = _mock_intent()
            api_client.post(self.URL, {'order_id': order.id}, format='json')

        called_amount = mock_create.call_args[1]['amount']
        assert called_amount == 120000  # 1200.00 * 100


    # --- Idempotency ---

    def test_reuses_existing_pending_payment_with_same_amount(self, api_client):
        """
        GIVEN an order that already has a pending Payment for the same amount
        WHEN create-payment-intent is called again
        THEN no new Payment is created and the existing clientSecret is returned.
        """
        order = OrderFactory(status='pending_payment')
        amount = float(order.product.price)
        existing_payment = PaymentFactory(
            order=order,
            stripe_payment_intent_id='pi_existing',
            amount=amount,
            status='pending',
        )

        existing_intent = _mock_intent(client_secret='cs_existing', intent_id='pi_existing')

        with patch('payments.views.create_payment_intent_view.stripe.PaymentIntent.retrieve') as mock_retrieve, \
             patch('payments.views.create_payment_intent_view.stripe.PaymentIntent.create') as mock_create:
            mock_retrieve.return_value = existing_intent
            response = api_client.post(self.URL, {'order_id': order.id}, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['clientSecret'] == 'cs_existing'
        mock_create.assert_not_called()
        assert Payment.objects.filter(order=order).count() == 1

    def test_cancels_old_intent_when_amount_changes(self, api_client):
        """
        GIVEN an order with an existing pending Payment at one amount
        WHEN the effective amount differs (e.g. discount was added)
        THEN the old PaymentIntent is cancelled and a new one is created.
        """
        product = ProductFactory(price='1500.00', discount_price=None, stock_quantity=5)
        order = OrderFactory(status='pending_payment', product=product)
        # Existing payment at old amount
        PaymentFactory(
            order=order,
            stripe_payment_intent_id='pi_old',
            amount='999.00',  # different from product price
            status='pending',
        )

        new_intent = _mock_intent(client_secret='cs_new', intent_id='pi_new')

        with patch('payments.views.create_payment_intent_view.stripe.PaymentIntent.cancel') as mock_cancel, \
             patch('payments.views.create_payment_intent_view.stripe.PaymentIntent.create') as mock_create:
            mock_create.return_value = new_intent
            response = api_client.post(self.URL, {'order_id': order.id}, format='json')

        assert response.status_code == status.HTTP_200_OK
        mock_cancel.assert_called_once_with('pi_old')
        mock_create.assert_called_once()
        assert Payment.objects.filter(order=order, stripe_payment_intent_id='pi_new').exists()
