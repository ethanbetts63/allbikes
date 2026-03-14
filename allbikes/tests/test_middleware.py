import pytest
from django.http import HttpResponse
from django.test import RequestFactory
from allbikes.middleware import NoCacheApiMiddleware

class TestNoCacheApiMiddleware:

    def test_adds_no_store_for_api_requests(self):
        # Setup
        factory = RequestFactory()
        request = factory.get('/api/test/')
        get_response = lambda req: HttpResponse("API response")
        middleware = NoCacheApiMiddleware(get_response)

        # Act
        response = middleware(request)

        # Assert
        assert response['Cache-Control'] == 'no-store'

    def test_does_not_add_no_store_for_non_api_requests(self):
        # Setup
        factory = RequestFactory()
        request = factory.get('/home/')
        get_response = lambda req: HttpResponse("Home page")
        middleware = NoCacheApiMiddleware(get_response)

        # Act
        response = middleware(request)

        # Assert
        assert 'Cache-Control' not in response or response['Cache-Control'] != 'no-store'

    def test_handles_api_root(self):
        factory = RequestFactory()
        request = factory.get('/api/')
        get_response = lambda req: HttpResponse("API root")
        middleware = NoCacheApiMiddleware(get_response)

        response = middleware(request)

        assert response['Cache-Control'] == 'no-store'
