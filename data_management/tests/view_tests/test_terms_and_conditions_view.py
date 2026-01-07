from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from data_management.models import TermsAndConditions
from django.core.cache import cache
import time

class LatestTermsAndConditionsViewTest(APITestCase):

    def setUp(self):
        """
        Ensure a clean state before each test.
        """
        TermsAndConditions.objects.all().delete()
        cache.clear()
        self.url = reverse('data_management:latest-terms')

    def test_no_terms_found(self):
        """
        Test that a 404 is returned if no TermsAndConditions exist.
        """
        # setUp ensures the DB is empty
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_returns_latest_terms(self):
        """
        Test that the view returns only the most recently published terms.
        """
        # Create an older version
        TermsAndConditions.objects.create(version="1.0", content="Old content.")
        # Wait a moment to ensure distinct timestamps
        time.sleep(0.01)
        # Create the newest version
        TermsAndConditions.objects.create(version="2.0", content="New content.")
        
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Check that the content of the latest version is returned
        self.assertEqual(response.data['version'], "2.0")
        self.assertEqual(response.data['content'], "New content.")

    def test_view_is_publicly_accessible(self):
        """
        Ensure the view can be accessed without authentication.
        """
        # This test now runs with an empty DB, so 404 is the expected public response
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_caching_header_present(self):
        """
        Test that the response includes the 'Cache-Control' header.
        """
        TermsAndConditions.objects.create(version="1.0", content="Cache test")
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('Cache-Control', response)
        self.assertTrue(response['Cache-Control'].startswith('max-age='))
