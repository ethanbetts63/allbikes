import pytest
from unittest.mock import MagicMock
from rest_framework.test import APIRequestFactory
from rest_framework.request import Request


@pytest.fixture(autouse=True)
def block_external_notifications(monkeypatch):
    """
    Safety net: no test may ever send a real SMS or email.

    The `if settings.DEBUG` guard in `_send_admin_sms` cannot protect tests,
    because Django's test framework (and pytest-django) force
    `settings.DEBUG = False` during the test run regardless of `.env`. So we
    block the actual network boundaries here for every test:

      * Twilio  — replace `_send_admin_sms` with a no-op mock.
      * Mailgun — default `requests.post` (used by `_send_mailgun`) to a mock
                  that mimics a successful response.

    Tests that assert on send behaviour patch `requests.post` (or these names)
    themselves; those patches nest on top of these and take precedence while
    they run, so this only catches the tests that would otherwise send for real.
    """
    monkeypatch.setattr("notifications.utils.email._send_admin_sms", MagicMock(), raising=False)

    safe_response = MagicMock()
    safe_response.raise_for_status = MagicMock()
    monkeypatch.setattr("notifications.utils.email.requests.post", MagicMock(return_value=safe_response), raising=False)


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
