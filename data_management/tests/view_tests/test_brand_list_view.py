from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from data_management.models.brand import Brand

class BrandListViewTest(APITestCase):
    @classmethod
    def setUpTestData(cls):
        # Create a few brands with names out of alphabetical order
        cls.brand_c = Brand.objects.create(name="Brand C", serviceable=True)
        cls.brand_a = Brand.objects.create(name="Brand A", serviceable=False)
        cls.brand_b = Brand.objects.create(name="Brand B", serviceable=True)
        cls.url = reverse('data_management:brand-list')

    def test_view_is_publicly_accessible(self):
        """
        Ensure the view can be accessed without authentication.
        """
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_lists_all_brands(self):
        """
        Test that the view returns a list of all brand objects.
        """
        response = self.client.get(self.url)
        self.assertEqual(len(response.data), 3)

    def test_brands_are_ordered_by_name(self):
        """
        Test that the returned brands are ordered alphabetically by name.
        """
        response = self.client.get(self.url)
        # Expected order: Brand A, Brand B, Brand C
        self.assertEqual(response.data[0]['name'], 'Brand A')
        self.assertEqual(response.data[1]['name'], 'Brand B')
        self.assertEqual(response.data[2]['name'], 'Brand C')
