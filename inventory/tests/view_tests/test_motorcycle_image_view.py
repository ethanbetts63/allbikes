import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from PIL import Image
from io import BytesIO

from inventory.models import Motorcycle
from inventory.tests.factories.motorcycle_factory import MotorcycleFactory
from data_management.tests.factories.user_factory import UserFactory

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def admin_user():
    return UserFactory(is_staff=True, is_superuser=True)

@pytest.fixture
def regular_user():
    return UserFactory()

@pytest.fixture
def admin_client(admin_user):
    client = APIClient()
    client.force_authenticate(user=admin_user)
    return client

@pytest.fixture
def regular_client(regular_user):
    client = APIClient()
    client.force_authenticate(user=regular_user)
    return client

def create_test_image():
    """Creates a simple in-memory image file for testing uploads."""
    file = BytesIO()
    image = Image.new('RGB', (100, 100), color='red')
    image.save(file, 'jpeg')
    file.name = 'test.jpg'
    file.seek(0)
    return file

@pytest.mark.django_db
class TestMotorcycleImageView:
    """Tests for the MotorcycleImageView."""

    def test_upload_image_admin(self, admin_client):
        """
        GIVEN a motorcycle
        WHEN an admin user uploads a valid image file
        THEN the response should be 201 Created and the image associated with the motorcycle.
        """
        motorcycle = MotorcycleFactory()
        url = reverse('inventory:motorcycle-image-upload', kwargs={'motorcycle_pk': motorcycle.pk})
        image_file = create_test_image()
        
        data = {'image': image_file}
        response = admin_client.post(url, data, format='multipart')

        assert response.status_code == status.HTTP_201_CREATED
        motorcycle.refresh_from_db()
        assert motorcycle.images.count() == 1
        assert motorcycle.images.first().image.name.endswith('.jpg')

    def test_upload_image_unauthenticated(self, api_client):
        """
        GIVEN a motorcycle
        WHEN an unauthenticated user tries to upload an image
        THEN the response should be 401 Unauthorized.
        """
        motorcycle = MotorcycleFactory()
        url = reverse('inventory:motorcycle-image-upload', kwargs={'motorcycle_pk': motorcycle.pk})
        image_file = create_test_image()
        data = {'image': image_file}
        response = api_client.post(url, data, format='multipart')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_upload_image_regular_user(self, regular_client):
        """
        GIVEN a motorcycle
        WHEN a non-admin authenticated user tries to upload an image
        THEN the response should be 403 Forbidden.
        """
        motorcycle = MotorcycleFactory()
        url = reverse('inventory:motorcycle-image-upload', kwargs={'motorcycle_pk': motorcycle.pk})
        image_file = create_test_image()
        data = {'image': image_file}
        response = regular_client.post(url, data, format='multipart')
        
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_upload_image_bad_request(self, admin_client):
        """
        GIVEN a motorcycle
        WHEN an admin user sends a request with no image data
        THEN the response should be 400 Bad Request.
        """
        motorcycle = MotorcycleFactory()
        url = reverse('inventory:motorcycle-image-upload', kwargs={'motorcycle_pk': motorcycle.pk})
        response = admin_client.post(url, {}, format='multipart')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_upload_image_to_nonexistent_motorcycle(self, admin_client):
        """
        GIVEN a non-existent motorcycle pk
        WHEN an admin user tries to upload an image
        THEN the response should be 404 Not Found.
        """
        non_existent_pk = 9999
        url = reverse('inventory:motorcycle-image-upload', kwargs={'motorcycle_pk': non_existent_pk})
        image_file = create_test_image()
        data = {'image': image_file}
        response = admin_client.post(url, data, format='multipart')
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
