from django.test import TestCase
from django.utils import timezone
from data_management.models.terms_and_conditions import TermsAndConditions
import time

class TermsAndConditionsModelTest(TestCase):

    def test_string_representation(self):
        """
        Test that the __str__ method returns the correct format.
        """
        term = TermsAndConditions(version="1.1", content="<p>Test content.</p>")
        self.assertEqual(str(term), "Terms and Conditions v1.1")

    def test_published_at_defaults_to_now(self):
        """
        Test that the published_at field defaults to the current time.
        """
        term = TermsAndConditions.objects.create(version="1.0", content="Content")
        self.assertLess((timezone.now() - term.published_at).total_seconds(), 2)

    def test_ordering(self):
        """
        Test that terms are ordered by published_at in descending order.
        """
        t1 = TermsAndConditions.objects.create(version="1.0", content="First.")
        # Ensure the timestamp is distinct for ordering
        time.sleep(0.01)
        t2 = TermsAndConditions.objects.create(version="2.0", content="Second.")
        time.sleep(0.01)
        t3 = TermsAndConditions.objects.create(version="3.0", content="Third.")

        terms = list(TermsAndConditions.objects.all())
        self.assertEqual(terms[0], t3)
        self.assertEqual(terms[1], t2)
        self.assertEqual(terms[2], t1)
