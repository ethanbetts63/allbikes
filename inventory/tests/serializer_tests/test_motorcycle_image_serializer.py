import pytest
from inventory.serializers import MotorcycleImageSerializer
from inventory.tests.factories.motorcycle_image_factory import MotorcycleImageFactory

@pytest.mark.django_db
def test_motorcycle_image_serializer_contains_expected_fields():
    """
    Test that the serializer output contains the exact fields we expect.
    """
    image = MotorcycleImageFactory()
    serializer = MotorcycleImageSerializer(instance=image)
    data = serializer.data
    expected_keys = ['id', 'image', 'order', 'motorcycle']
    assert set(data.keys()) == set(expected_keys)

@pytest.mark.django_db
def test_motorcycle_image_serialization():
    """
    Test that a MotorcycleImage instance is correctly serialized.
    """
    image = MotorcycleImageFactory(order=5)
    serializer = MotorcycleImageSerializer(instance=image)
    data = serializer.data

    assert data['order'] == 5
    assert 'test_image' in data['image'] # The ImageField just returns the URL string
    assert data['motorcycle'] == image.motorcycle.id
