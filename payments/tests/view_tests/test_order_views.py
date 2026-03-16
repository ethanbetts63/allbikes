import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from payments.models import Order
from payments.tests.factories.order_factory import OrderFactory
from product.tests.factories.product_factory import ProductFactory
from inventory.tests.factories.motorcycle_factory import MotorcycleFactory


@pytest.fixture
def api_client():
    return APIClient()


def _order_payload(product_id):
    return {
        'product': product_id,
        'customer_name': 'Jane Smith',
        'customer_email': 'jane@example.com',
        'customer_phone': '0400000000',
        'address_line1': '123 Test St',
        'address_line2': '',
        'suburb': 'Perth',
        'state': 'WA',
        'postcode': '6000',
    }


@pytest.mark.django_db
class TestOrderCreateView:
    """Tests for POST /api/shop/orders/"""

    def test_creates_order_and_returns_ids(self, api_client):
        """
        GIVEN a valid payload for an in-stock product
        WHEN an anonymous user posts to create an order
        THEN 201 is returned with order_id and order_reference.
        """
        product = ProductFactory(stock_quantity=5)
        url = reverse('payments:order-create')
        response = api_client.post(url, _order_payload(product.id), format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert 'order_id' in response.data
        assert 'order_reference' in response.data

    def test_order_status_is_pending_payment(self, api_client):
        """
        GIVEN a valid payload
        WHEN an order is created
        THEN the order is saved with status 'pending_payment'.
        """
        product = ProductFactory(stock_quantity=5)
        url = reverse('payments:order-create')
        api_client.post(url, _order_payload(product.id), format='json')
        order = Order.objects.first()
        assert order.status == 'pending_payment'

    def test_stock_is_not_decremented_on_order_creation(self, api_client):
        """
        GIVEN a product with 3 units of stock
        WHEN an order is created
        THEN stock_quantity is unchanged (decrement moves to webhook).
        """
        product = ProductFactory(stock_quantity=3)
        url = reverse('payments:order-create')
        api_client.post(url, _order_payload(product.id), format='json')
        product.refresh_from_db()
        assert product.stock_quantity == 3

    def test_returns_409_when_out_of_stock(self, api_client):
        """
        GIVEN a product with 0 stock
        WHEN a user tries to create an order
        THEN 409 Conflict is returned.
        """
        product = ProductFactory(stock_quantity=0)
        url = reverse('payments:order-create')
        response = api_client.post(url, _order_payload(product.id), format='json')
        assert response.status_code == status.HTTP_409_CONFLICT

    def test_returns_400_for_invalid_payload(self, api_client):
        """
        GIVEN a payload with a missing required field
        WHEN posted
        THEN 400 Bad Request is returned.
        """
        url = reverse('payments:order-create')
        response = api_client.post(url, {'product': 999}, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestOrderRetrieveView:
    """Tests for GET /api/shop/orders/<order_reference>/"""

    def test_returns_order_by_reference(self, api_client):
        """
        GIVEN an existing order
        WHEN retrieved by its order_reference
        THEN 200 OK and the order data are returned.
        """
        order = OrderFactory()
        url = reverse('payments:order-detail', kwargs={'order_reference': order.order_reference})
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['order_reference'] == order.order_reference

    def test_returns_404_for_unknown_reference(self, api_client):
        """
        GIVEN a reference that doesn't match any order
        WHEN retrieved
        THEN 404 Not Found is returned.
        """
        url = reverse('payments:order-detail', kwargs={'order_reference': 'SS-00000000'})
        response = api_client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_response_includes_product_fields(self, api_client):
        """
        GIVEN an existing order
        WHEN retrieved
        THEN the response includes product_name and amount_paid.
        """
        order = OrderFactory()
        url = reverse('payments:order-detail', kwargs={'order_reference': order.order_reference})
        response = api_client.get(url)
        assert 'product_name' in response.data
        assert 'amount_paid' in response.data


def _deposit_payload(motorcycle_id):
    return {
        'motorcycle': motorcycle_id,
        'customer_name': 'Jane Smith',
        'customer_email': 'jane@example.com',
        'customer_phone': '0400000000',
    }


@pytest.mark.django_db
class TestDepositOrderCreateView:
    """Tests for deposit orders via POST /api/payments/orders/"""

    def test_creates_deposit_order_for_for_sale_motorcycle(self, api_client):
        """
        GIVEN a for_sale new motorcycle
        WHEN a deposit order is created
        THEN 201 is returned with order_id and order_reference.
        """
        motorcycle = MotorcycleFactory(condition='new', status='for_sale')
        url = reverse('payments:order-create')
        response = api_client.post(url, _deposit_payload(motorcycle.id), format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert 'order_id' in response.data
        assert 'order_reference' in response.data

    def test_deposit_order_payment_type_is_forced_to_deposit(self, api_client):
        """
        GIVEN a for_sale motorcycle
        WHEN a deposit order is created
        THEN the saved order has payment_type='deposit' regardless of client payload.
        """
        motorcycle = MotorcycleFactory(condition='new', status='for_sale')
        url = reverse('payments:order-create')
        api_client.post(url, _deposit_payload(motorcycle.id), format='json')
        order = Order.objects.get(motorcycle=motorcycle)
        assert order.payment_type == 'deposit'

    def test_returns_409_when_motorcycle_is_reserved(self, api_client):
        """
        GIVEN a motorcycle with status='reserved'
        WHEN a deposit order is attempted
        THEN 409 Conflict is returned.
        """
        motorcycle = MotorcycleFactory(condition='new', status='reserved')
        url = reverse('payments:order-create')
        response = api_client.post(url, _deposit_payload(motorcycle.id), format='json')
        assert response.status_code == status.HTTP_409_CONFLICT

    def test_returns_409_when_motorcycle_is_sold(self, api_client):
        """
        GIVEN a motorcycle with status='sold'
        WHEN a deposit order is attempted
        THEN 409 Conflict is returned.
        """
        motorcycle = MotorcycleFactory(condition='new', status='sold')
        url = reverse('payments:order-create')
        response = api_client.post(url, _deposit_payload(motorcycle.id), format='json')
        assert response.status_code == status.HTTP_409_CONFLICT

    def test_returns_400_when_phone_missing(self, api_client):
        """
        GIVEN a deposit payload with no phone number
        WHEN posted
        THEN 400 Bad Request is returned.
        """
        motorcycle = MotorcycleFactory(condition='new', status='for_sale')
        url = reverse('payments:order-create')
        payload = _deposit_payload(motorcycle.id)
        payload['customer_phone'] = ''
        response = api_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
