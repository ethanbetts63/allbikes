from django.test import TestCase
from django.core.exceptions import ValidationError
from data_management.models.site_settings import SiteSettings

class SiteSettingsModelTest(TestCase):

    def setUp(self):
        # Ensure no SiteSettings object exists before each test
        SiteSettings.objects.all().delete()

    def test_string_representation(self):
        settings = SiteSettings.load()
        self.assertEqual(str(settings), "Site Settings")

    def test_singleton_pattern_enforcement(self):
        """
        Test that creating a second instance of SiteSettings raises an error.
        """
        SiteSettings.load()  # Create the first instance
        with self.assertRaises(ValueError):
            SiteSettings.objects.create()

    def test_load_method_creates_instance(self):
        """
        Test that the load() method creates an instance if it doesn't exist.
        """
        self.assertEqual(SiteSettings.objects.count(), 0)
        settings = SiteSettings.load()
        self.assertIsInstance(settings, SiteSettings)
        self.assertEqual(SiteSettings.objects.count(), 1)

    def test_load_method_retrieves_existing_instance(self):
        """
        Test that the load() method retrieves the existing instance.
        """
        s1 = SiteSettings.load()
        s2 = SiteSettings.load()
        self.assertEqual(s1.pk, s2.pk)
        self.assertEqual(SiteSettings.objects.count(), 1)

    def test_default_values(self):
        """
        Test that the default values are set correctly on creation.
        """
        settings = SiteSettings.load()
        self.assertTrue(settings.enable_motorcycle_mover)
        self.assertFalse(settings.enable_banner)
        self.assertEqual(settings.phone_number, "94334613")
        self.assertEqual(settings.opening_hours_saturday, "Closed")

    def test_can_modify_and_save_settings(self):
        """
        Test that the singleton instance can be modified and saved.
        """
        settings = SiteSettings.load()
        settings.enable_banner = True
        settings.banner_text = "New Banner Text"
        settings.save()

        updated_settings = SiteSettings.load()
        self.assertTrue(updated_settings.enable_banner)
        self.assertEqual(updated_settings.banner_text, "New Banner Text")
