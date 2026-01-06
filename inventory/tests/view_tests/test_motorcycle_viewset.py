@pytest.mark.django_db
class TestManageImagesAction:
    """Tests for the manage_images custom action."""

    @pytest.fixture
    def admin_user(self):
        return UserFactory(is_staff=True, is_superuser=True)

    @pytest.fixture
    def admin_client(self, admin_user):
        client = APIClient()
        client.force_authenticate(user=admin_user)
        return client

    @pytest.fixture
    def motorcycle_with_images(self):
        motorcycle = MotorcycleFactory()
        img1 = MotorcycleImageFactory(motorcycle=motorcycle, order=0)
        img2 = MotorcycleImageFactory(motorcycle=motorcycle, order=1)
        img3 = MotorcycleImageFactory(motorcycle=motorcycle, order=2)
        return motorcycle, [img1, img2, img3]

    def test_manage_images_reorder(self, admin_client, motorcycle_with_images):
        """
        GIVEN a motorcycle with 3 images
        WHEN an admin sends a POST request to reorder the images
        THEN the images' order should be updated in the database.
        """
        motorcycle, images = motorcycle_with_images
        img1, img2, img3 = images
        
        url = reverse('inventory:motorcycle-manage-images', kwargs={'pk': motorcycle.pk})
        
        # New order: img3, img1, img2
        data = [
            {'id': img3.id, 'order': 0},
            {'id': img1.id, 'order': 1},
            {'id': img2.id, 'order': 2},
        ]
        
        response = admin_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_204_NO_CONTENT

        img1.refresh_from_db()
        img2.refresh_from_db()
        img3.refresh_from_db()

        assert img3.order == 0
        assert img1.order == 1
        assert img2.order == 2

    def test_manage_images_delete(self, admin_client, motorcycle_with_images):
        """
        GIVEN a motorcycle with 3 images
        WHEN an admin sends a POST request with only 2 images
        THEN the omitted image should be deleted.
        """
        motorcycle, images = motorcycle_with_images
        img1, img2, _ = images
        
        url = reverse('inventory:motorcycle-manage-images', kwargs={'pk': motorcycle.pk})
        
        # New data only contains img1 and img2
        data = [
            {'id': img1.id, 'order': 0},
            {'id': img2.id, 'order': 1},
        ]
        
        response = admin_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_204_NO_CONTENT
        
        motorcycle.refresh_from_db()
        assert motorcycle.images.count() == 2
        assert motorcycle.images.filter(id=img1.id).exists()
        assert motorcycle.images.filter(id=img2.id).exists()

    def test_manage_images_unauthenticated(self, api_client, motorcycle_with_images):
        """
        GIVEN a motorcycle with images
        WHEN an unauthenticated user tries to manage images
        THEN the response should be 401 Unauthorized.
        """
        motorcycle, _ = motorcycle_with_images
        url = reverse('inventory:motorcycle-manage-images', kwargs={'pk': motorcycle.pk})
        response = api_client.post(url, [], format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_manage_images_bad_data(self, admin_client, motorcycle_with_images):
        """
        GIVEN a motorcycle with images
        WHEN an admin sends malformed data
        THEN the response should be 400 Bad Request.
        """
        motorcycle, _ = motorcycle_with_images
        url = reverse('inventory:motorcycle-manage-images', kwargs={'pk': motorcycle.pk})
        
        # Test with a dictionary instead of a list
        response = admin_client.post(url, {'bad': 'data'}, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

        # Test with a list of incomplete objects
        response = admin_client.post(url, [{'id': 1}], format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST