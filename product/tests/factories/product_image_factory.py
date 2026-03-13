import factory
from factory.django import DjangoModelFactory, ImageField

from product.models import ProductImage
from .product_factory import ProductFactory


class ProductImageFactory(DjangoModelFactory):
    class Meta:
        model = ProductImage

    product = factory.SubFactory(ProductFactory)
    image = ImageField(filename="test_product.jpg", color="blue")
    order = factory.Sequence(lambda n: n)
