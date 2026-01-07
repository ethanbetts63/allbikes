from unittest.mock import patch, MagicMock
from django.test import TestCase, override_settings
import requests
from json import JSONDecodeError

from service.views.mechanics_desk_service import MechanicsDeskService


class MechanicsDeskServiceTests(TestCase):
    def setUp(self):
        self.service = MechanicsDeskService()
        # Ensure the token is set for most tests
        self.service.token = "test_token"

    @patch("requests.request")
    def test_get_job_types_success(self, mock_request):
        """
        Test successful retrieval of job types.
        """
        expected_response = [{"id": 1, "name": "Standard Service"}]
        mock_response = MagicMock()
        mock_response.ok = True
        mock_response.json.return_value = expected_response
        mock_request.return_value = mock_response

        response = self.service.get_job_types()

        mock_request.assert_called_once_with(
            "GET",
            f"{self.service.BASE_URL}/booking_requests/available_job_types",
            params={"token": "test_token"}
        )
        self.assertEqual(response, expected_response)

    @patch("requests.request")
    def test_create_booking_success(self, mock_request):
        """
        Test successful creation of a booking.
        MechanicDesk returns HTML on successful POST, so we check for status.
        """
        booking_data = {"customer_name": "Test User", "bike_model": "Test Bike"}
        mock_response = MagicMock()
        mock_response.ok = True
        # For POSTs, the service returns a custom success dictionary
        mock_request.return_value = mock_response

        response = self.service.create_booking(booking_data)

        expected_data = booking_data.copy()
        expected_data["token"] = "test_token"
        mock_request.assert_called_once_with(
            "POST",
            f"{self.service.BASE_URL}/booking_requests/create_booking",
            json=expected_data,
            params=None
        )
        self.assertEqual(response, {"status": "success", "message": "Booking request sent successfully."})

    @patch("requests.request")
    def test_http_error_handling(self, mock_request):
        """
        Test that an HTTPError is handled gracefully.
        """
        mock_response = MagicMock()
        mock_response.raise_for_status.side_effect = requests.exceptions.HTTPError(
            "404 Client Error", response=MagicMock(status_code=404, text="Not Found")
        )
        mock_request.return_value = mock_response

        response = self.service.get_job_types()

        self.assertIn("error", response)
        self.assertIn("404 Client Error", response["error"])
        self.assertEqual(response["details"], "Not Found")

    @patch("requests.request")
    def test_request_exception_handling(self, mock_request):
        """
        Test that a generic RequestException is handled.
        """
        mock_request.side_effect = requests.exceptions.RequestException("Connection Error")

        response = self.service.get_job_types()

        self.assertIn("error", response)
        self.assertIn("Connection Error", response["error"])

    @override_settings(MECHANICDESK_BOOKING_TOKEN=None)
    def test_no_api_token(self):
        """
        Test that the service returns an error if the token is not configured.
        """
        service_no_token = MechanicsDeskService()
        # Explicitly set token to None as it might be cached on the instance
        service_no_token.token = None
        response = service_no_token.get_job_types()
        self.assertEqual(response, {"error": "MechanicDesk API token is not configured."})

    @patch("requests.request")
    def test_json_decode_error_handling(self, mock_request):
        """
        Test handling of a non-JSON response from the server on a GET request.
        """
        mock_response = MagicMock()
        mock_response.ok = True
        mock_response.json.side_effect = JSONDecodeError("msg", "doc", 0)
        mock_response.text = "Invalid JSON or HTML page"
        mock_request.return_value = mock_response

        response = self.service.get_job_types()

        self.assertIn("error", response)
        self.assertEqual(response["error"], "Received non-JSON response from external service")
        self.assertEqual(response["details"], "Invalid JSON or HTML page")
