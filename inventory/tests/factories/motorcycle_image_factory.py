import factory
from factory.django import DjangoModelFactory, ImageField
from inventory.models import MotorcycleImage
from .motorcycle_factory import MotorcycleFactory

class MotorcycleImageFactory(DjangoModelFactory):
    class Meta:
        model = MotorcycleImage

    motorcycle = factory.SubFactory(MotorcycleFactory)
    image = ImageField(filename='test_image.jpg', color='blue')
    order = factory.Sequence(lambda n: n)
