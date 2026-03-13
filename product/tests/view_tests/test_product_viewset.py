import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from product.models import Product
from product.tests.factories.product_factory import ProductFactory
from product.tests.factories.product_image_factory import ProductImageFactory
from data_management.tests.factories.user_factory import UserFactory


@pytest.fixture
def api_client():
    return APIClient()


@pytest.mark.django_db
class TestProductViewSetList:
    """Tests for the list action of the ProductViewSet."""

    def test_public_can_list_active_products(self, api_client):
        """
        GIVEN 3 active products
        WHEN an unauthenticated user lists products
        THEN the response is 200 OK and contains 3 products.
        """
        ProductFactory.create_batch(3, is_active=True)
        url = reverse("product:product-list")
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 3

    def test_public_list_excludes_inactive_products(self, api_client):
        """
        GIVEN 2 active products and 1 inactive product
        WHEN an unauthenticated user lists products
        THEN only the 2 active products are returned.
        """
        ProductFactory.create_batch(2, is_active=True)
        ProductFactory(is_active=False)
        url = reverse("product:product-list")
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 2

    def test_admin_list_includes_inactive_products(self, api_client):
        """
        GIVEN 2 active products and 1 inactive product
        WHEN an admin user lists products
        THEN all 3 products are returned.
        """
        ProductFactory.create_batch(2, is_active=True)
        ProductFactory(is_active=False)
        admin = UserFactory(is_staff=True, is_superuser=True)
        api_client.force_authenticate(user=admin)
        url = reverse("product:product-list")
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 3

    def test_response_includes_stock_fields(self, api_client):
        """
        GIVEN an active product
        WHEN an unauthenticated user lists products
        THEN each result includes in_stock and low_stock fields.
        """
        ProductFactory(is_active=True, stock_quantity=5)
        url = reverse("product:product-list")
        response = api_client.get(url)
        result = response.data["results"][0]
        assert "in_stock" in result
        assert "low_stock" in result


@pytest.mark.django_db
class TestProductViewSetRetrieve:
    """Tests for the retrieve action of the ProductViewSet."""

    def test_public_can_retrieve_active_product(self, api_client):
        """
        GIVEN an active product
        WHEN an unauthenticated user retrieves it by pk
        THEN the response is 200 OK with the product data.
        """
        product = ProductFactory(is_active=True)
        url = reverse("product:product-detail", kwargs={"pk": product.pk})
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["id"] == product.id
        assert response.data["name"] == product.name

    def test_public_cannot_retrieve_inactive_product(self, api_client):
        """
        GIVEN an inactive product
        WHEN an unauthenticated user tries to retrieve it
        THEN the response is 404 Not Found.
        """
        product = ProductFactory(is_active=False)
        url = reverse("product:product-detail", kwargs={"pk": product.pk})
        response = api_client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_admin_can_retrieve_inactive_product(self, api_client):
        """
        GIVEN an inactive product
        WHEN an admin user retrieves it
        THEN the response is 200 OK.
        """
        product = ProductFactory(is_active=False)
        admin = UserFactory(is_staff=True, is_superuser=True)
        api_client.force_authenticate(user=admin)
        url = reverse("product:product-detail", kwargs={"pk": product.pk})
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestProductViewSetWriteAccess:
    """Tests for the create, update, and delete actions of the ProductViewSet."""

    @pytest.fixture
    def admin_client(self, api_client):
        admin = UserFactory(is_staff=True, is_superuser=True)
        api_client.force_authenticate(user=admin)
        return api_client

    def test_anonymous_cannot_create_product(self, api_client):
        """
        GIVEN valid product data
        WHEN an unauthenticated user tries to create a product
        THEN the response is 401 Unauthorized.
        """
        url = reverse("product:product-list")
        response = api_client.post(url, {"name": "Test", "price": "999.00", "stock_quantity": 5})
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_admin_can_create_product(self, admin_client):
        """
        GIVEN valid product data
        WHEN an admin user creates a product
        THEN the response is 201 Created and the product exists in the database.
        """
        url = reverse("product:product-list")
        data = {"name": "New Scooter", "price": "1299.00", "stock_quantity": 10, "is_active": True}
        response = admin_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "New Scooter"
        assert Product.objects.filter(name="New Scooter").exists()

    def test_admin_can_update_product_stock(self, admin_client):
        """
        GIVEN an existing product
        WHEN an admin patches the stock_quantity
        THEN the response is 200 OK and the stock is updated.
        """
        product = ProductFactory(stock_quantity=5)
        url = reverse("product:product-detail", kwargs={"pk": product.pk})
        response = admin_client.patch(url, {"stock_quantity": 20}, format="json")
        assert response.status_code == status.HTTP_200_OK
        product.refresh_from_db()
        assert product.stock_quantity == 20

    def test_admin_can_delete_product(self, admin_client):
        """
        GIVEN an existing product
        WHEN an admin deletes it
        THEN the response is 204 No Content and the product no longer exists.
        """
        product = ProductFactory()
        url = reverse("product:product-detail", kwargs={"pk": product.pk})
        response = admin_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Product.objects.filter(pk=product.pk).exists()

    def test_non_admin_staff_cannot_create(self, api_client):
        """
        GIVEN a regular authenticated (non-staff) user
        WHEN they try to create a product
        THEN the response is 403 Forbidden.
        """
        user = UserFactory(is_staff=False)
        api_client.force_authenticate(user=user)
        url = reverse("product:product-list")
        response = api_client.post(url, {"name": "Test", "price": "999.00", "stock_quantity": 5})
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestManageImagesAction:
    """Tests for the manage_images custom action on ProductViewSet."""

    @pytest.fixture
    def admin_client(self, api_client):
        admin = UserFactory(is_staff=True, is_superuser=True)
        api_client.force_authenticate(user=admin)
        return api_client

    @pytest.fixture
    def product_with_images(self):
        product = ProductFactory()
        img1 = ProductImageFactory(product=product, order=0)
        img2 = ProductImageFactory(product=product, order=1)
        img3 = ProductImageFactory(product=product, order=2)
        return product, [img1, img2, img3]

    def test_anonymous_cannot_manage_images(self, api_client, product_with_images):
        """
        GIVEN a product with images
        WHEN an unauthenticated user posts to manage_images
        THEN the response is 401 Unauthorized.
        """
        product, _ = product_with_images
        url = reverse("product:product-manage-images", kwargs={"pk": product.pk})
        response = api_client.post(url, [], format="json")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_manage_images_reorders_images(self, admin_client, product_with_images):
        """
        GIVEN a product with 3 images in order 0, 1, 2
        WHEN an admin sends a reorder request swapping positions
        THEN the image orders are updated in the database.
        """
        product, images = product_with_images
        img1, img2, img3 = images
        url = reverse("product:product-manage-images", kwargs={"pk": product.pk})
        data = [
            {"id": img3.id, "order": 0},
            {"id": img1.id, "order": 1},
            {"id": img2.id, "order": 2},
        ]
        response = admin_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_204_NO_CONTENT
        img1.refresh_from_db()
        img2.refresh_from_db()
        img3.refresh_from_db()
        assert img3.order == 0
        assert img1.order == 1
        assert img2.order == 2

    def test_manage_images_deletes_unlisted_images(self, admin_client, product_with_images):
        """
        GIVEN a product with 3 images
        WHEN an admin sends a manage_images request with only 2 images
        THEN the omitted image is deleted.
        """
        product, images = product_with_images
        img1, img2, img3 = images
        url = reverse("product:product-manage-images", kwargs={"pk": product.pk})
        data = [{"id": img1.id, "order": 0}, {"id": img2.id, "order": 1}]
        response = admin_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert product.images.count() == 2
        assert not product.images.filter(id=img3.id).exists()

    def test_manage_images_expects_a_list(self, admin_client, product_with_images):
        """
        GIVEN a product with images
        WHEN an admin sends a dict instead of a list
        THEN the response is 400 Bad Request.
        """
        product, _ = product_with_images
        url = reverse("product:product-manage-images", kwargs={"pk": product.pk})
        response = admin_client.post(url, {"bad": "data"}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_manage_images_requires_id_and_order(self, admin_client, product_with_images):
        """
        GIVEN a product with images
        WHEN an admin sends a list item missing the 'order' key
        THEN the response is 400 Bad Request.
        """
        product, images = product_with_images
        img1 = images[0]
        url = reverse("product:product-manage-images", kwargs={"pk": product.pk})
        response = admin_client.post(url, [{"id": img1.id}], format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
