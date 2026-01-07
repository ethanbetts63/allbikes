from django.test import TestCase
from data_management.models.brand import Brand
from data_management.serializers.brand_serializer import BrandSerializer

class BrandSerializerTest(TestCase):
    def test_serializer_fields(self):
        """
        Test that the serializer includes the expected fields.
        """
        brand = Brand.objects.create(name="Test Brand", serviceable=True)
        serializer = BrandSerializer(instance=brand)
        data = serializer.data

        self.assertEqual(set(data.keys()), set(['id', 'name', 'serviceable']))
        self.assertEqual(data['name'], "Test Brand")
        self.assertEqual(data['serviceable'], True)
