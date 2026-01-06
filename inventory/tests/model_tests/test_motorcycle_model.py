import pytest
from django.utils.text import slugify
from inventory.models import Motorcycle
from inventory.tests.factories.motorcycle_factory import MotorcycleFactory

@pytest.mark.django_db
def test_motorcycle_creation():
    """Test that a Motorcycle instance can be created with the factory."""
    motorcycle = MotorcycleFactory()
    assert motorcycle is not None
    assert isinstance(motorcycle, Motorcycle)
    assert Motorcycle.objects.count() == 1

@pytest.mark.django_db
def test_motorcycle_str_method():
    """Test the __str__ method of the Motorcycle model."""
    motorcycle = MotorcycleFactory(year=2023, make="Honda", model="CBR500R")
    expected_str = "2023 Honda CBR500R"
    assert str(motorcycle) == expected_str

@pytest.mark.django_db
def test_motorcycle_str_method_no_year():
    """Test the __str__ method when the year is None."""
    motorcycle = MotorcycleFactory(make="Vespa", model="Primavera 150", year=None)
    expected_str = "Vespa Primavera 150"
    assert str(motorcycle) == expected_str

@pytest.mark.django_db
def test_motorcycle_slug_creation_on_save():
    """
    Test that a slug is correctly generated and saved for a new motorcycle instance.
    """
    # The factory calls save(), which should trigger slug generation.
    motorcycle = MotorcycleFactory(year=2023, make="Yamaha", model="MT-07", id=123)
    
    # Refresh from DB to ensure we have the version with the updated slug
    motorcycle.refresh_from_db()

    expected_slug = slugify(f"{motorcycle.year}-{motorcycle.make}-{motorcycle.model}-{motorcycle.id}")
    assert motorcycle.slug is not None
    assert motorcycle.slug == expected_slug

@pytest.mark.django_db
def test_motorcycle_slug_update_on_field_change():
    """
    Test that the slug is updated if a relevant field changes.
    """
    motorcycle = MotorcycleFactory(year=2021, make="Kawasaki", model="Ninja 400", id=456)
    motorcycle.refresh_from_db() # Get initial slug

    # Change a field that affects the slug
    motorcycle.model = "Ninja 650"
    motorcycle.save()
    motorcycle.refresh_from_db()

    expected_slug = slugify(f"{motorcycle.year}-{motorcycle.make}-{motorcycle.model}-{motorcycle.id}")
    assert motorcycle.slug == expected_slug

@pytest.mark.django_db
def test_get_absolute_url():
    """Test the get_absolute_url method."""
    motorcycle = MotorcycleFactory(id=789, year=2022, make="Suzuki", model="DR-Z400")
    motorcycle.refresh_from_db() # Get slug

    expected_url = f"/inventory/motorcycles/{motorcycle.slug}"
    assert motorcycle.get_absolute_url() == expected_url
