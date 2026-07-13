import io
import pytest
from django.urls import reverse
from PIL import Image as PILImage
from rest_framework import status
from rest_framework.test import APIClient

from product.tests.factories.product_factory import ProductFactory
from data_management.tests.factories.user_factory import UserFactory


@pytest.fixture
def api_client():
    return APIClient()


def make_upload_image():
    img = PILImage.new("RGB", (100, 100), color="red")
    buffer = io.BytesIO()
    img.save(buffer, format="JPEG")
    buffer.seek(0)
    buffer.name = "test.jpg"
    return buffer


@pytest.mark.django_db
class TestProductImageView:
    """Tests for the ProductImageView upload endpoint."""

    @pytest.fixture
    def admin_client(self, api_client):
        admin = UserFactory(is_staff=True, is_superuser=True)
        api_client.force_authenticate(user=admin)
        return api_client

    def test_anonymous_cannot_upload_image(self, api_client):
        """
        GIVEN a product
        WHEN an unauthenticated user posts to the image upload endpoint
        THEN the response is 401 Unauthorized.
        """
        product = ProductFactory()
        url = reverse("product:product-image-upload", kwargs={"product_pk": product.pk})
        response = api_client.post(url, {})
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_admin_can_upload_image(self, admin_client):
        """
        GIVEN a product
        WHEN an admin uploads a valid image
        THEN the response is 201 Created and the image is attached to the product.
        """
        product = ProductFactory()
        url = reverse("product:product-image-upload", kwargs={"product_pk": product.pk})
        response = admin_client.post(
            url, {"image": make_upload_image(), "order": 0}, format="multipart"
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert product.images.count() == 1

    def test_upload_to_nonexistent_product_returns_404(self, admin_client):
        """
        GIVEN a product pk that does not exist
        WHEN an admin posts to the image upload endpoint
        THEN the response is 404 Not Found.
        """
        url = reverse("product:product-image-upload", kwargs={"product_pk": 99999})
        response = admin_client.post(
            url, {"image": make_upload_image(), "order": 0}, format="multipart"
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_upload_without_image_returns_400(self, admin_client):
        """
        GIVEN a product
        WHEN an admin posts to the image upload endpoint without an image file
        THEN the response is 400 Bad Request.
        """
        product = ProductFactory()
        url = reverse("product:product-image-upload", kwargs={"product_pk": product.pk})
        response = admin_client.post(url, {"order": 0}, format="multipart")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
