from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth.models import User

class UserProfileViewTest(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            username='testuser', 
            email='test@example.com',
            first_name='Test',
            last_name='User',
            password='password123'
        )
        cls.url = reverse('data_management:user-profile')

    def test_authentication_required(self):
        """
        Test that unauthenticated users receive a 401 Unauthorized response.
        """
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_user_gets_profile(self):
        """
        Test that an authenticated user receives their own profile data.
        """
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], self.user.username)
        self.assertEqual(response.data['email'], self.user.email)
        self.assertEqual(response.data['first_name'], self.user.first_name)
        self.assertEqual(response.data['last_name'], self.user.last_name)
        self.assertIn('is_staff', response.data)
