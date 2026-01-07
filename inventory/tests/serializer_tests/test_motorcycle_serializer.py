import pytest
from inventory.serializers import MotorcycleSerializer
from inventory.tests.factories.motorcycle_factory import MotorcycleFactory
from inventory.tests.factories.motorcycle_image_factory import MotorcycleImageFactory

@pytest.mark.django_db
def test_motorcycle_serializer_contains_expected_fields():
    """
    Test that the serializer output contains the exact fields we expect.
    """
    motorcycle = MotorcycleFactory()
    serializer = MotorcycleSerializer(instance=motorcycle)
    data = serializer.data
    expected_keys = [
                    'id', 'slug', 'make', 'model', 'year', 'price', 'condition', 'status',
                    'is_featured', 'odometer', 'engine_size', 'description', 'youtube_link',
                    'rego', 'rego_exp', 'stock_number', 'warranty_months', 'transmission', 'images',
                    'discount_price'    ]
    assert set(data.keys()) == set(expected_keys)

@pytest.mark.django_db
def test_motorcycle_serialization():
    """
    Test that a Motorcycle instance is correctly serialized.
    """
    motorcycle = MotorcycleFactory(make="Honda", model="CBR1000RR")
    serializer = MotorcycleSerializer(instance=motorcycle)
    data = serializer.data

    assert data['make'] == "Honda"
    assert data['model'] == "CBR1000RR"
    assert data['price'] == str(motorcycle.price) # DecimalFields are serialized to strings

@pytest.mark.django_db
def test_motorcycle_serializer_with_images():
    """
    Test that the serializer correctly includes nested image data.
    """
    motorcycle = MotorcycleFactory()
    # Create a few images associated with the motorcycle
    MotorcycleImageFactory(motorcycle=motorcycle)
    MotorcycleImageFactory(motorcycle=motorcycle)

    serializer = MotorcycleSerializer(instance=motorcycle)
    data = serializer.data

    assert 'images' in data
    assert len(data['images']) == 2
    # Check a field from the nested serializer
    assert 'image' in data['images'][0]
    assert 'order' in data['images'][0]
