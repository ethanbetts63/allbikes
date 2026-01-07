from django.test import TestCase
from data_management.models.site_settings import SiteSettings
from data_management.serializers.site_settings_serializer import SiteSettingsSerializer

class SiteSettingsSerializerTest(TestCase):
    def setUp(self):
        SiteSettings.objects.all().delete()
        self.settings = SiteSettings.load()

    def test_serializer_contains_expected_fields(self):
        """
        Test that the serializer output contains a sample of expected fields and correct values.
        """
        serializer = SiteSettingsSerializer(instance=self.settings)
        data = serializer.data

        # Test for presence of a few key fields
        self.assertIn('enable_motorcycle_mover', data)
        self.assertIn('phone_number', data)
        self.assertIn('email_address', data)
        self.assertIn('opening_hours_monday', data)

        # Test the values of those fields
        self.assertEqual(data['enable_motorcycle_mover'], self.settings.enable_motorcycle_mover)
        self.assertEqual(data['phone_number'], self.settings.phone_number)
        self.assertEqual(data['email_address'], self.settings.email_address)
        self.assertEqual(data['opening_hours_monday'], self.settings.opening_hours_monday)
