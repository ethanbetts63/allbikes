import pytest
from datetime import date
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APIClient
from service.models import BlockedDate
from service.tests.factories import BlockedDateFactory


@pytest.fixture
def admin_client():
    user = User.objects.create_superuser('admin', 'admin@example.com', 'password')
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.mark.django_db
class TestBlockedDateViewSet:
    def test_requires_admin(self):
        client = APIClient()
        client.force_authenticate(user=User.objects.create_user('u', 'u@e.com', 'p'))
        response = client.get('/api/service/admin/blocked-dates/')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_block_a_date(self, admin_client):
        response = admin_client.post('/api/service/admin/blocked-dates/', {'date': '2026-01-01'}, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert BlockedDate.objects.filter(date=date(2026, 1, 1)).exists()

    def test_blocking_twice_is_idempotent(self, admin_client):
        admin_client.post('/api/service/admin/blocked-dates/', {'date': '2026-01-01'}, format='json')
        response = admin_client.post('/api/service/admin/blocked-dates/', {'date': '2026-01-01'}, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert BlockedDate.objects.filter(date=date(2026, 1, 1)).count() == 1

    def test_unblock_by_date(self, admin_client):
        BlockedDateFactory(date=date(2026, 1, 1))
        response = admin_client.post('/api/service/admin/blocked-dates/unblock/', {'date': '2026-01-01'}, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert not BlockedDate.objects.filter(date=date(2026, 1, 1)).exists()
