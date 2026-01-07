from django.test import TestCase
from data_management.models.brand import Brand

class BrandModelTest(TestCase):
    def test_string_representation(self):
        brand = Brand(name="Test Brand")
        self.assertEqual(str(brand), brand.name)

    def test_serviceable_default(self):
        brand = Brand.objects.create(name="Another Test Brand")
        self.assertFalse(brand.serviceable)
