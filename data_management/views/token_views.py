from django.conf import settings
import logging
from django.middleware.csrf import get_token
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from data_management.throttling import LoginRateThrottle
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer

logger = logging.getLogger(__name__)


def _set_auth_cookies(response, access_token, refresh_token=None, request=None):
    if request is not None:
        get_token(request)  # ensure csrftoken cookie is issued with this response

    secure = not settings.DEBUG
    # SameSite=None requires Secure=True; in dev the Next.js proxy makes requests
    # same-origin so Lax is sufficient and browsers won't reject the cookie.
    samesite = 'None' if secure else 'Lax'
    access_max_age = int(settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds())
    refresh_max_age = int(settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds())

    response.set_cookie(
        key=settings.AUTH_COOKIE,
        value=str(access_token),
        max_age=access_max_age,
        httponly=True,
        secure=secure,
        samesite=samesite,
    )
    if refresh_token is not None:
        response.set_cookie(
            key=settings.AUTH_COOKIE_REFRESH,
            value=str(refresh_token),
            max_age=refresh_max_age,
            httponly=True,
            secure=secure,
            samesite=samesite,
        )


def _delete_auth_cookies(response):
    secure = not settings.DEBUG
    samesite = 'None' if secure else 'Lax'
    response.delete_cookie(settings.AUTH_COOKIE, samesite=samesite)
    response.delete_cookie(settings.AUTH_COOKIE_REFRESH, samesite=samesite)


class CookieTokenObtainPairView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [LoginRateThrottle]

    def post(self, request, *args, **kwargs):
        login_identifier = request.data.get('email') or request.data.get('username') or 'unknown'
        remote_addr = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', '')).split(',')[0]

        serializer = TokenObtainPairSerializer(data=request.data, context={'request': request})
        try:
            serializer.is_valid(raise_exception=True)
        except Exception:
            logger.warning("Login failed identifier=%s ip=%s", login_identifier, remote_addr)
            return Response(
                {'detail': 'No active account found with the given credentials.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        user = serializer.user

        response = Response({'detail': 'Login successful.'})
        _set_auth_cookies(
            response,
            serializer.validated_data['access'],
            serializer.validated_data['refresh'],
            request=request,
        )
        return response


class CookieTokenRefreshView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get(settings.AUTH_COOKIE_REFRESH)
        if not refresh_token:
            return Response({'detail': 'Refresh token not found.'}, status=status.HTTP_401_UNAUTHORIZED)

        serializer = TokenRefreshSerializer(data={'refresh': refresh_token})
        try:
            serializer.is_valid(raise_exception=True)
        except Exception:
            return Response({'detail': 'Invalid or expired refresh token.'}, status=status.HTTP_401_UNAUTHORIZED)

        response = Response({'detail': 'Token refreshed.'})
        _set_auth_cookies(response, serializer.validated_data['access'], serializer.validated_data.get('refresh'))
        return response


class CookieLogoutView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        response = Response({'detail': 'Logged out successfully.'})
        _delete_auth_cookies(response)
        return response
