import pytest
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from data_management.tests.factories.user_factory import UserFactory


@pytest.mark.django_db
class TestCookieJWTAuthentication:
    """
    Tests for CookieJWTAuthentication — reads the JWT access token from an
    HttpOnly cookie and enforces CSRF on every authenticated request.

    Uses /api/data/me/ as the test endpoint (requires authentication).

    NOTE — CSRF enforcement cannot be tested via the Django test client.
    It sets request._dont_enforce_csrf_checks = True unconditionally, which
    causes CsrfViewMiddleware to skip the check regardless of headers or cookies.
    Verify CSRF manually per the steps in _docs/security.md.
    """

    def setup_method(self):
        self.client = APIClient()
        self.url = '/api/data/me/'
        self.user = UserFactory()

    def test_valid_access_cookie_authenticates_request(self):
        """
        GIVEN a valid access token in the access_token cookie
        WHEN a GET request is made to an authenticated endpoint
        THEN 200 is returned with the user's profile.
        """
        refresh = RefreshToken.for_user(self.user)
        self.client.cookies['access_token'] = str(refresh.access_token)

        response = self.client.get(self.url)

        assert response.status_code == 200
        assert response.data['username'] == self.user.username

    def test_no_cookie_returns_401(self):
        """
        GIVEN no access_token cookie
        WHEN a GET request is made to an authenticated endpoint
        THEN 401 is returned.
        """
        response = self.client.get(self.url)

        assert response.status_code == 401

    def test_invalid_token_in_cookie_returns_401(self):
        """
        GIVEN a malformed token in the access_token cookie
        WHEN a GET request is made
        THEN 401 is returned.
        """
        self.client.cookies['access_token'] = 'not.a.real.jwt'

        response = self.client.get(self.url)

        assert response.status_code == 401

    def test_authorization_header_is_not_accepted(self):
        """
        GIVEN a valid token in the Authorization header (old pattern)
        WHEN a GET request is made with no cookie
        THEN 401 is returned — header-based auth is no longer supported.
        """
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        response = self.client.get(self.url)

        assert response.status_code == 401
