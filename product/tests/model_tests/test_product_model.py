import pytest
from product.models import Product
from product.tests.factories.product_factory import ProductFactory


@pytest.mark.django_db
class TestProductModel:
    def test_str_returns_name(self):
        """
        GIVEN a product with a specific name
        WHEN str() is called
        THEN it returns the product's name.
        """
        product = ProductFactory(name="Test Scooter")
        assert str(product) == "Test Scooter"

    def test_slug_is_auto_generated_on_save(self):
        """
        GIVEN a new product
        WHEN it is saved
        THEN a slug is automatically generated.
        """
        product = ProductFactory(name="Cool Scooter")
        assert product.slug is not None
        assert product.slug != ""

    def test_slug_contains_slugified_name_and_id(self):
        """
        GIVEN a product with a specific name
        WHEN it is saved
        THEN the slug contains the slugified name and the product id.
        """
        product = ProductFactory(name="Cool Scooter Pro")
        assert "cool-scooter-pro" in product.slug
        assert str(product.id) in product.slug

    def test_low_stock_threshold_constant(self):
        """
        GIVEN the Product model
        THEN the LOW_STOCK_THRESHOLD class constant is 3.
        """
        assert Product.LOW_STOCK_THRESHOLD == 3
