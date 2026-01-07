from django.test import TestCase
from django.utils import timezone
from data_management.models.terms_and_conditions import TermsAndConditions
from data_management.serializers.terms_and_conditions_serializer import TermsAndConditionsSerializer

class TermsAndConditionsSerializerTest(TestCase):

    def test_serializer_fields_and_data(self):
        """
        Test that the serializer includes the expected fields and correct data.
        """
        now = timezone.now()
        terms = TermsAndConditions.objects.create(
            version="1.5",
            content="<p>Test content here.</p>",
            published_at=now
        )
        serializer = TermsAndConditionsSerializer(instance=terms)
        data = serializer.data

        expected_fields = ['version', 'content', 'published_at']
        self.assertEqual(set(data.keys()), set(expected_fields))

        self.assertEqual(data['version'], "1.5")
        self.assertEqual(data['content'], "<p>Test content here.</p>")
        # Compare timezone-aware strings, slicing off microseconds for compatibility
        self.assertEqual(data['published_at'][:-7], now.isoformat()[:-6])
