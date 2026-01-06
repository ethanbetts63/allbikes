import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from inventory.models import Motorcycle
from inventory.tests.factories.motorcycle_factory import MotorcycleFactory
from data_management.tests.factories.user_factory import UserFactory

@pytest.fixture
def api_client():
    return APIClient()

@pytest.mark.django_db
class TestMotorcycleViewSetList:
    """Tests for the list action of the MotorcycleViewSet."""

    def test_list_motorcycles_unauthenticated(self, api_client):
        """
        GIVEN 2 motorcycles
        WHEN an unauthenticated user lists motorcycles
        THEN the response should be 200 OK and contain 2 motorcycles.
        """
        MotorcycleFactory.create_batch(2)
        url = reverse("motorcycle-list")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 2
        assert len(response.data['results']) == 2

    def test_filter_by_condition(self, api_client):
        """
        GIVEN a new and a used motorcycle
        WHEN filtering by condition='new'
        THEN only the new motorcycle should be returned.
        """
        MotorcycleFactory(condition='new')
        MotorcycleFactory(condition='used')
        url = reverse("motorcycle-list")
        response = api_client.get(url, {'condition': 'new'})

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert response.data['results'][0]['condition'] == 'new'

    def test_filter_by_featured(self, api_client):
        """
        GIVEN a featured and a non-featured motorcycle
        WHEN filtering by is_featured='true'
        THEN only the featured motorcycle should be returned.
        """
        MotorcycleFactory(is_featured=True)
        MotorcycleFactory(is_featured=False)
        url = reverse("motorcycle-list")
        response = api_client.get(url, {'is_featured': 'true'})

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert response.data['results'][0]['is_featured'] is True
        
    def test_filter_by_price_range(self, api_client):
        """
        GIVEN motorcycles with different prices
        WHEN filtering by a min_price and max_price
        THEN only motorcycles within that price range should be returned.
        """
        MotorcycleFactory(price=1000)
        MotorcycleFactory(price=2500)
        MotorcycleFactory(price=5000)
        url = reverse("motorcycle-list")
        response = api_client.get(url, {'min_price': 2000, 'max_price': 3000})

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert response.data['results'][0]['price'] == "2500.00"

    def test_ordering_by_price_asc(self, api_client):
        """
        GIVEN two motorcycles with different prices
        WHEN ordering by 'price_asc'
        THEN the motorcycles should be returned in ascending order of price.
        """
        m1 = MotorcycleFactory(price=5000)
        m2 = MotorcycleFactory(price=2000)
        url = reverse("motorcycle-list")
        response = api_client.get(url, {'ordering': 'price_asc'})

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 2
        results = response.data['results']
        assert results[0]['id'] == m2.id
        assert results[1]['id'] == m1.id

    def test_ordering_by_year_desc(self, api_client):
        """
        GIVEN two motorcycles from different years
        WHEN ordering by 'year_desc'
        THEN the motorcycles should be returned in descending order of year.
        """
        m1 = MotorcycleFactory(year=2020)
        m2 = MotorcycleFactory(year=2023)
        url = reverse("motorcycle-list")
        response = api_client.get(url, {'ordering': 'year_desc'})

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 2
        results = response.data['results']
        assert results[0]['id'] == m2.id
        assert results[1]['id'] == m1.id
        
@pytest.mark.django_db
class TestMotorcycleViewSetWriteAccess:
    """Tests for the write actions (create, update, destroy) of the MotorcycleViewSet."""

    @pytest.fixture
    def admin_user(self):
        return UserFactory(is_staff=True, is_superuser=True)

    @pytest.fixture
    def admin_client(self, admin_user):
        client = APIClient()
        client.force_authenticate(user=admin_user)
        return client

    def test_create_motorcycle_unauthenticated(self, api_client):
        """
        GIVEN valid motorcycle data
        WHEN an unauthenticated user tries to create a motorcycle
        THEN the response should be 403 Forbidden.
        """
        url = reverse("motorcycle-list")
        data = {'make': 'Test', 'model': 'Model'}
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_create_motorcycle_authenticated_admin(self, admin_client):
        """
        GIVEN valid motorcycle data
        WHEN an admin user tries to create a motorcycle
        THEN the response should be 201 Created.
        """
        url = reverse("motorcycle-list")
        data = {
            "make": "NewMake", "model": "NewModel", "year": 2024, "price": 9999.99,
            "condition": "new", "status": "for_sale"
        }
        response = admin_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert Motorcycle.objects.count() == 1
        assert Motorcycle.objects.get().make == "NewMake"

    def test_update_motorcycle_admin(self, admin_client):
        """
        GIVEN a motorcycle
        WHEN an admin user updates it
        THEN the response should be 200 OK and the motorcycle updated.
        """
        motorcycle = MotorcycleFactory(make="OldMake")
        url = reverse("motorcycle-detail", kwargs={'pk': motorcycle.pk})
        data = {"make": "UpdatedMake"}
        response = admin_client.patch(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        motorcycle.refresh_from_db()
        assert motorcycle.make == "UpdatedMake"

    def test_delete_motorcycle_admin(self, admin_client):
        """
        GIVEN a motorcycle
        WHEN an admin user deletes it
        THEN the response should be 204 No Content and the motorcycle deleted.
        """
        motorcycle = MotorcycleFactory()
        url = reverse("motorcycle-detail", kwargs={'pk': motorcycle.pk})
        response = admin_client.delete(url)
        
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert Motorcycle.objects.count() == 0
