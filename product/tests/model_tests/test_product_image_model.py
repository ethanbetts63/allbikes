import pytest
from product.models import ProductImage
from product.tests.factories.product_factory import ProductFactory

@pytest.mark.django_db
class TestProductImageModel:

    def test_str(self):
        product = ProductFactory(name="Test Product")
        image = ProductImage(product=product)
        assert str(image) == "Image for Test Product"

    def test_default_order(self):
        product = ProductFactory()
        image = ProductImage.objects.create(product=product, image="products/test.jpg")
        assert image.order == 0

    def test_related_name(self):
        product = ProductFactory()
        image = ProductImage.objects.create(product=product, image="products/test.jpg")
        assert image in product.images.all()
