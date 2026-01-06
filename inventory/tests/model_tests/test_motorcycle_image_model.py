import pytest
from inventory.models import MotorcycleImage
from inventory.tests.factories.motorcycle_image_factory import MotorcycleImageFactory
from inventory.tests.factories.motorcycle_factory import MotorcycleFactory

@pytest.mark.django_db
def test_motorcycle_image_creation():
    """Test that a MotorcycleImage instance can be created with the factory."""
    image = MotorcycleImageFactory()
    assert image is not None
    assert isinstance(image, MotorcycleImage)
    assert MotorcycleImage.objects.count() == 1
    assert image.image is not None
    assert image.image.name.endswith('.jpg')

@pytest.mark.django_db
def test_motorcycle_image_str_method():
    """Test the __str__ method of the MotorcycleImage model."""
    motorcycle = MotorcycleFactory(year=2023, make="Ducati", model="Panigale V4")
    image = MotorcycleImageFactory(motorcycle=motorcycle)
    expected_str = f"Image for {motorcycle}"
    assert str(image) == expected_str
