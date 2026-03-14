import pytest
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from data_management.tests.factories.user_factory import UserFactory


@pytest.mark.django_db
class TestCookieTokenObtainPairView:
    """Tests for POST /api/token/ — sets HttpOnly JWT cookies on login."""

    def setup_method(self):
        self.client = APIClient()
        self.url = '/api/token/'
        self.user = UserFactory(password='testpass123')

    def test_valid_credentials_return_200(self):
        """
        GIVEN valid username and password
        WHEN POST /api/token/
        THEN 200 is returned.
        """
        response = self.client.post(
            self.url,
            {'username': self.user.username, 'password': 'testpass123'},
            format='json',
        )
        assert response.status_code == 200

    def test_valid_credentials_set_access_cookie(self):
        """
        GIVEN valid credentials
        WHEN login succeeds
        THEN the response sets an access_token cookie.
        """
        response = self.client.post(
            self.url,
            {'username': self.user.username, 'password': 'testpass123'},
            format='json',
        )
        assert 'access_token' in response.cookies

    def test_valid_credentials_set_refresh_cookie(self):
        """
        GIVEN valid credentials
        WHEN login succeeds
        THEN the response sets a refresh_token cookie.
        """
        response = self.client.post(
            self.url,
            {'username': self.user.username, 'password': 'testpass123'},
            format='json',
        )
        assert 'refresh_token' in response.cookies

    def test_response_body_does_not_contain_tokens(self):
        """
        GIVEN valid credentials
        WHEN login succeeds
        THEN the response body does not contain the access or refresh tokens
        (they are in cookies only).
        """
        response = self.client.post(
            self.url,
            {'username': self.user.username, 'password': 'testpass123'},
            format='json',
        )
        assert 'access' not in response.data
        assert 'refresh' not in response.data

    def test_invalid_credentials_return_401(self):
        """
        GIVEN wrong password
        WHEN POST /api/token/
        THEN 401 is returned and no cookies are set.
        """
        response = self.client.post(
            self.url,
            {'username': self.user.username, 'password': 'wrongpassword'},
            format='json',
        )
        assert response.status_code == 401
        assert 'access_token' not in response.cookies


@pytest.mark.django_db
class TestCookieTokenRefreshView:
    """Tests for POST /api/token/refresh/ — rotates access token via refresh cookie."""

    def setup_method(self):
        self.client = APIClient()
        self.url = '/api/token/refresh/'
        self.user = UserFactory()

    def test_valid_refresh_cookie_returns_200(self):
        """
        GIVEN a valid refresh_token cookie
        WHEN POST /api/token/refresh/
        THEN 200 is returned.
        """
        refresh = RefreshToken.for_user(self.user)
        self.client.cookies['refresh_token'] = str(refresh)

        response = self.client.post(self.url, format='json')

        assert response.status_code == 200

    def test_valid_refresh_cookie_sets_new_access_cookie(self):
        """
        GIVEN a valid refresh_token cookie
        WHEN the token is refreshed
        THEN a new access_token cookie is set.
        """
        refresh = RefreshToken.for_user(self.user)
        self.client.cookies['refresh_token'] = str(refresh)

        response = self.client.post(self.url, format='json')

        assert 'access_token' in response.cookies

    def test_missing_refresh_cookie_returns_401(self):
        """
        GIVEN no refresh_token cookie
        WHEN POST /api/token/refresh/
        THEN 401 is returned.
        """
        response = self.client.post(self.url, format='json')

        assert response.status_code == 401

    def test_invalid_refresh_token_returns_401(self):
        """
        GIVEN an invalid refresh_token cookie value
        WHEN POST /api/token/refresh/
        THEN 401 is returned.
        """
        self.client.cookies['refresh_token'] = 'not.a.real.token'

        response = self.client.post(self.url, format='json')

        assert response.status_code == 401


@pytest.mark.django_db
class TestCookieLogoutView:
    """Tests for POST /api/token/logout/ — clears auth cookies."""

    def setup_method(self):
        self.client = APIClient()
        self.url = '/api/token/logout/'
        self.user = UserFactory()

    def test_logout_returns_200(self):
        """
        WHEN POST /api/token/logout/
        THEN 200 is returned.
        """
        response = self.client.post(self.url, format='json')

        assert response.status_code == 200

    def test_logout_clears_access_cookie(self):
        """
        GIVEN a logged-in user with an access_token cookie
        WHEN POST /api/token/logout/
        THEN the access_token cookie is deleted (max-age 0 or empty value).
        """
        refresh = RefreshToken.for_user(self.user)
        self.client.cookies['access_token'] = str(refresh.access_token)

        response = self.client.post(self.url, format='json')

        assert response.cookies['access_token'].value == ''

    def test_logout_clears_refresh_cookie(self):
        """
        GIVEN a logged-in user with a refresh_token cookie
        WHEN POST /api/token/logout/
        THEN the refresh_token cookie is deleted.
        """
        refresh = RefreshToken.for_user(self.user)
        self.client.cookies['refresh_token'] = str(refresh)

        response = self.client.post(self.url, format='json')

        assert response.cookies['refresh_token'].value == ''
