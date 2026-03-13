import pytest
from rest_framework.test import APIRequestFactory
from rest_framework.request import Request


@pytest.fixture
def drf_request_factory():
    factory = APIRequestFactory()

    def make_request(user=None):
        request = factory.get("/")
        drf_request = Request(request)
        if user is not None:
            drf_request.user = user
        return drf_request

    return make_request
