import pytest
from product.models import Product
from product.serializers.product_serializer import ProductSerializer
from product.tests.factories.product_factory import ProductFactory


@pytest.mark.django_db
class TestProductSerializerStockFields:
    def test_in_stock_true_when_stock_positive(self):
        """
        GIVEN a product with stock_quantity > 0
        WHEN serialized
        THEN in_stock is True.
        """
        product = ProductFactory(stock_quantity=5)
        data = ProductSerializer(product).data
        assert data["in_stock"] is True

    def test_in_stock_false_when_stock_zero(self):
        """
        GIVEN a product with stock_quantity == 0
        WHEN serialized
        THEN in_stock is False.
        """
        product = ProductFactory(stock_quantity=0)
        data = ProductSerializer(product).data
        assert data["in_stock"] is False

    def test_low_stock_true_when_within_threshold(self):
        """
        GIVEN a product with 0 < stock_quantity <= LOW_STOCK_THRESHOLD
        WHEN serialized
        THEN low_stock is True.
        """
        product = ProductFactory(stock_quantity=2)
        data = ProductSerializer(product).data
        assert data["low_stock"] is True

    def test_low_stock_true_at_threshold_boundary(self):
        """
        GIVEN a product with stock_quantity exactly equal to LOW_STOCK_THRESHOLD
        WHEN serialized
        THEN low_stock is True (boundary is inclusive).
        """
        product = ProductFactory(stock_quantity=Product.LOW_STOCK_THRESHOLD)
        data = ProductSerializer(product).data
        assert data["low_stock"] is True

    def test_low_stock_false_when_above_threshold(self):
        """
        GIVEN a product with stock_quantity > LOW_STOCK_THRESHOLD
        WHEN serialized
        THEN low_stock is False.
        """
        product = ProductFactory(stock_quantity=10)
        data = ProductSerializer(product).data
        assert data["low_stock"] is False

    def test_low_stock_false_when_stock_is_zero(self):
        """
        GIVEN a product with stock_quantity == 0
        WHEN serialized
        THEN low_stock is False (out of stock is not the same as low stock).
        """
        product = ProductFactory(stock_quantity=0)
        data = ProductSerializer(product).data
        assert data["low_stock"] is False

    def test_youtube_link_is_included_in_serialized_output(self):
        """
        GIVEN a product with a youtube_link
        WHEN serialized
        THEN youtube_link is present in the output.
        """
        product = ProductFactory(youtube_link="https://www.youtube.com/watch?v=abc123")
        data = ProductSerializer(product).data
        assert "youtube_link" in data
        assert data["youtube_link"] == "https://www.youtube.com/watch?v=abc123"

    def test_youtube_link_is_null_when_not_set(self):
        """
        GIVEN a product with no youtube_link
        WHEN serialized
        THEN youtube_link is None.
        """
        product = ProductFactory(youtube_link=None)
        data = ProductSerializer(product).data
        assert data["youtube_link"] is None

    def test_slug_is_read_only(self):
        """
        GIVEN a product
        WHEN the serializer is used for write with a slug value
        THEN the slug field is ignored (read-only).
        """
        product = ProductFactory()
        serializer = ProductSerializer(
            product,
            data={"name": product.name, "price": str(product.price), "stock_quantity": 1, "slug": "custom-slug"},
            partial=True,
        )
        assert serializer.is_valid()
        # slug is in read_only_fields, so it won't be in validated_data
        assert "slug" not in serializer.validated_data
