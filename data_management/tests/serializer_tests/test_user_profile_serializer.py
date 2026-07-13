from django.test import TestCase
from django.contrib.auth.models import User
from data_management.serializers.user_profile_serializer import UserProfileSerializer

class UserProfileSerializerTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            first_name='Test',
            last_name='User',
            password='password123'
        )
        # By default, create_user sets is_staff to False
        self.user.is_staff = True
        self.user.save()

    def test_serializer_contains_expected_fields_and_data(self):
        """
        Test that the serializer includes the correct fields and data for a User.
        """
        serializer = UserProfileSerializer(instance=self.user)
        data = serializer.data

        expected_fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff']
        self.assertEqual(set(data.keys()), set(expected_fields))

        self.assertEqual(data['username'], 'testuser')
        self.assertEqual(data['email'], 'test@example.com')
        self.assertEqual(data['first_name'], 'Test')
        self.assertEqual(data['last_name'], 'User')
        self.assertTrue(data['is_staff'])
