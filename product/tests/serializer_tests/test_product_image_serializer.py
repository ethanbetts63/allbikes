import pytest
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory
from product.models import ProductImage
from product.serializers.product_image_serializer import ProductImageSerializer
from product.tests.factories.product_factory import ProductFactory

@pytest.mark.django_db
class TestProductImageSerializer:

    def test_serializer_contains_expected_fields(self):
        product = ProductFactory()
        image = ProductImage.objects.create(product=product, image="products/test.jpg")
        serializer = ProductImageSerializer(image)
        data = serializer.data
        assert set(data.keys()) == {'id', 'image', 'thumbnail', 'medium', 'order', 'product'}

    def test_get_thumbnail_returns_url_if_order_is_zero(self):
        product = ProductFactory()
        image = ProductImage(product=product, image="products/test.jpg", order=0)
        
        # We need to mock the thumbnail property behavior
        from unittest.mock import PropertyMock, patch, MagicMock
        
        # Patch the descriptor or the property on the class, but since we have an instance
        # and ImageSpecField is a descriptor, we can try patching the class attribute
        # but that affects other tests. 
        
        # A safer way might be to mock the serializer's access to the field?
        # No, the serializer accesses `obj.thumbnail.url`.
        
        # Let's try to wrap the image object in a MagicMock that delegates everything but thumbnail
        # or just use a full mock object for the serializer if we only care about serializer logic.
        
        mock_image = MagicMock(spec=ProductImage)
        mock_image.order = 0
        mock_image.product = product
        mock_image.image = MagicMock()
        mock_image.image.url = "/media/products/test.jpg"
        
        # Mock thumbnail
        mock_thumbnail = MagicMock()
        mock_thumbnail.url = "/media/cache/thumb.webp"
        mock_image.thumbnail = mock_thumbnail
        
        factory = APIRequestFactory()
        request = factory.get('/')
        
        serializer = ProductImageSerializer(mock_image, context={'request': request})
        data = serializer.data
        
        assert data['thumbnail'] == "http://testserver/media/cache/thumb.webp"

    def test_get_thumbnail_returns_none_if_order_not_zero(self):
        product = ProductFactory()
        image = ProductImage(product=product, image="products/test.jpg", order=1)
        
        serializer = ProductImageSerializer(image)
        data = serializer.data
        
        assert data['thumbnail'] is None
