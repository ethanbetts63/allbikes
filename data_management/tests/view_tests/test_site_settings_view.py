from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth.models import User
from data_management.models.site_settings import SiteSettings

class SiteSettingsViewSetTest(APITestCase):

    @classmethod
    def setUpTestData(cls):
        # Create the singleton settings instance
        SiteSettings.objects.all().delete()
        cls.settings = SiteSettings.load()

        # Create an admin and a regular user
        cls.admin_user = User.objects.create_superuser('admin', 'admin@example.com', 'password123')
        cls.regular_user = User.objects.create_user('user', 'user@example.com', 'password123')
        
        cls.url = reverse('data_management:site-settings')

    def test_retrieve_is_publicly_accessible(self):
        """
        Test that GET requests are allowed for any user.
        """
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email_address'], self.settings.email_address)

    def test_update_requires_admin_privileges(self):
        """
        Test that PUT/PATCH requests are forbidden for non-admin users.
        """
        # Test with no authentication
        response = self.client.put(self.url, {'email_address': 'new@test.com'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Test with regular user authentication
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.put(self.url, {'email_address': 'new@test.com'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_update_settings(self):
        """
        Test that an admin user can successfully update the settings.
        """
        self.client.force_authenticate(user=self.admin_user)
        new_email = 'admin_updated@example.com'
        new_phone = '1234567890'
        
        payload = {
            'email_address': new_email,
            'phone_number': new_phone
        }
        
        response = self.client.patch(self.url, payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify the changes were saved
        self.settings.refresh_from_db()
        self.assertEqual(self.settings.email_address, new_email)
        self.assertEqual(self.settings.phone_number, new_phone)

    def test_get_object_always_returns_singleton(self):
        """
        The view should always operate on the same single instance.
        """
        self.client.force_authenticate(user=self.admin_user)
        
        # First retrieval
        response1 = self.client.get(self.url)
        pk1 = response1.data['id']
        
        # Update and retrieve again
        self.client.patch(self.url, {'banner_text': 'A new banner text'})
        response2 = self.client.get(self.url)
        pk2 = response2.data['id']
        
        self.assertEqual(pk1, pk2)

