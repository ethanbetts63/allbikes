import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from shop.tests.factories.order_factory import OrderFactory
from data_management.tests.factories.user_factory import UserFactory


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def admin_client(api_client):
    admin = UserFactory(is_staff=True, is_superuser=True)
    api_client.force_authenticate(user=admin)
    return api_client


@pytest.mark.django_db
class TestAdminOrderListView:
    """Tests for GET /api/shop/admin/orders/"""

    def test_anonymous_cannot_list_orders(self, api_client):
        """
        GIVEN existing orders
        WHEN an anonymous user hits the admin list endpoint
        THEN 401 Unauthorized is returned.
        """
        OrderFactory.create_batch(2)
        url = reverse('shop:admin-order-list')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_non_staff_cannot_list_orders(self, api_client):
        """
        GIVEN a regular authenticated user
        WHEN they hit the admin list endpoint
        THEN 403 Forbidden is returned.
        """
        user = UserFactory(is_staff=False)
        api_client.force_authenticate(user=user)
        url = reverse('shop:admin-order-list')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_can_list_all_orders(self, admin_client):
        """
        GIVEN 3 orders
        WHEN an admin lists orders without a status filter
        THEN all 3 are returned.
        """
        OrderFactory.create_batch(3)
        url = reverse('shop:admin-order-list')
        response = admin_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 3

    def test_status_filter_returns_matching_orders(self, admin_client):
        """
        GIVEN 2 paid orders and 1 pending_payment order
        WHEN admin filters by status=paid
        THEN only the 2 paid orders are returned.
        """
        OrderFactory.create_batch(2, status='paid')
        OrderFactory(status='pending_payment')
        url = reverse('shop:admin-order-list')
        response = admin_client.get(url, {'status': 'paid'})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2
        assert all(o['status'] == 'paid' for o in response.data)

    def test_status_filter_accepts_comma_separated_values(self, admin_client):
        """
        GIVEN orders with various statuses
        WHEN admin filters by status=paid,dispatched
        THEN only orders with those two statuses are returned.
        """
        OrderFactory(status='paid')
        OrderFactory(status='dispatched')
        OrderFactory(status='pending_payment')
        url = reverse('shop:admin-order-list')
        response = admin_client.get(url, {'status': 'paid,dispatched'})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2


@pytest.mark.django_db
class TestAdminOrderDetailView:
    """Tests for GET /api/shop/admin/orders/<pk>/"""

    def test_admin_can_retrieve_order(self, admin_client):
        """
        GIVEN an existing order
        WHEN an admin retrieves it by pk
        THEN 200 OK and the order data are returned.
        """
        order = OrderFactory()
        url = reverse('shop:admin-order-detail', kwargs={'pk': order.pk})
        response = admin_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['order_reference'] == order.order_reference

    def test_returns_404_for_unknown_order(self, admin_client):
        """
        GIVEN a pk that doesn't match any order
        WHEN retrieved
        THEN 404 Not Found is returned.
        """
        url = reverse('shop:admin-order-detail', kwargs={'pk': 99999})
        response = admin_client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
class TestAdminOrderStatusView:
    """Tests for PATCH /api/shop/admin/orders/<pk>/status/"""

    def test_admin_can_update_status(self, admin_client):
        """
        GIVEN a pending_payment order
        WHEN an admin patches it to dispatched
        THEN 200 OK is returned and the order status is updated.
        """
        order = OrderFactory(status='pending_payment')
        url = reverse('shop:admin-order-status', kwargs={'pk': order.pk})
        response = admin_client.patch(url, {'status': 'dispatched'}, format='json')
        assert response.status_code == status.HTTP_200_OK
        order.refresh_from_db()
        assert order.status == 'dispatched'

    def test_invalid_status_returns_400(self, admin_client):
        """
        GIVEN a valid order
        WHEN an admin patches it with an invalid status
        THEN 400 Bad Request is returned.
        """
        order = OrderFactory()
        url = reverse('shop:admin-order-status', kwargs={'pk': order.pk})
        response = admin_client.patch(url, {'status': 'not_a_real_status'}, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_anonymous_cannot_update_status(self, api_client):
        """
        GIVEN a valid order
        WHEN an anonymous user tries to update the status
        THEN 401 Unauthorized is returned.
        """
        order = OrderFactory()
        url = reverse('shop:admin-order-status', kwargs={'pk': order.pk})
        response = api_client.patch(url, {'status': 'paid'}, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
