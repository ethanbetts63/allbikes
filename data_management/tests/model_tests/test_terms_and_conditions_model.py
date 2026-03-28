from django.test import TestCase
from django.utils import timezone
from data_management.models.terms_and_conditions import TermsAndConditions
import time


class TermsAndConditionsModelTest(TestCase):

    def test_string_representation(self):
        """
        Test that __str__ returns the term_type display label.
        """
        term = TermsAndConditions(term_type='hire', content="<p>Test content.</p>")
        self.assertEqual(str(term), "Terms and Conditions — Hire")

    def test_published_at_defaults_to_now(self):
        """
        Test that the published_at field defaults to the current time.
        """
        term = TermsAndConditions.objects.create(term_type='service', content="Content")
        self.assertLess((timezone.now() - term.published_at).total_seconds(), 2)

    def test_ordering(self):
        """
        Test that terms are ordered by published_at in descending order.
        """
        t1 = TermsAndConditions.objects.create(term_type='purchase', content="First.")
        time.sleep(0.01)
        t2 = TermsAndConditions.objects.create(term_type='service', content="Second.")
        time.sleep(0.01)
        t3 = TermsAndConditions.objects.create(term_type='hire', content="Third.")

        terms = list(TermsAndConditions.objects.all())
        self.assertEqual(terms[0], t3)
        self.assertEqual(terms[1], t2)
        self.assertEqual(terms[2], t1)

    def test_term_type_is_unique(self):
        """
        Test that two records with the same term_type cannot be created.
        """
        from django.db import IntegrityError
        TermsAndConditions.objects.create(term_type='hire', content="First hire terms.")
        with self.assertRaises(IntegrityError):
            TermsAndConditions.objects.create(term_type='hire', content="Duplicate hire terms.")
