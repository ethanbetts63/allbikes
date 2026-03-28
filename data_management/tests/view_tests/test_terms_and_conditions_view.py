from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from data_management.models import TermsAndConditions


class LatestTermsAndConditionsViewTest(APITestCase):

    def setUp(self):
        TermsAndConditions.objects.all().delete()
        self.url = reverse('data_management:latest-terms')

    def test_no_terms_found(self):
        """
        GIVEN no TermsAndConditions exist
        WHEN GET /api/data/terms/latest/
        THEN 404 is returned.
        """
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_returns_terms_filtered_by_type(self):
        """
        GIVEN hire and purchase terms exist
        WHEN GET /api/data/terms/latest/?type=hire
        THEN only the hire terms are returned.
        """
        TermsAndConditions.objects.create(term_type='purchase', content="Purchase terms.")
        TermsAndConditions.objects.create(term_type='hire', content="Hire terms.")

        response = self.client.get(self.url, {'type': 'hire'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['content'], "Hire terms.")

    def test_returns_404_for_unknown_type(self):
        """
        GIVEN only hire terms exist
        WHEN GET /api/data/terms/latest/?type=service
        THEN 404 is returned.
        """
        TermsAndConditions.objects.create(term_type='hire', content="Hire terms.")

        response = self.client.get(self.url, {'type': 'service'})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_returns_any_terms_when_no_type_given(self):
        """
        GIVEN purchase terms exist
        WHEN GET /api/data/terms/latest/ with no type param
        THEN 200 is returned with the most recently published terms.
        """
        TermsAndConditions.objects.create(term_type='purchase', content="Purchase terms.")

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['content'], "Purchase terms.")

    def test_view_is_publicly_accessible(self):
        """
        GIVEN no authentication
        WHEN GET /api/data/terms/latest/
        THEN 404 (not 401/403) is returned for empty DB.
        """
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
