import logging
import requests
from django.conf import settings
from json import JSONDecodeError

logger = logging.getLogger(__name__)


class MechanicsDeskService:
    BASE_URL = "https://www.mechanicdesk.com.au"

    def __init__(self):
        self.token = settings.MECHANICDESK_BOOKING_TOKEN

    def _make_request(self, method, endpoint, params=None, data=None):
        """Helper method to make requests to the MechanicDesk API."""
        if not self.token:
            logger.error("MechanicDesk API token is not configured.")
            return {"error": "MechanicDesk API token is not configured."}

        url = f"{self.BASE_URL}/{endpoint}"

        request_args = {'params': params}

        # Add the token to the request
        if method.upper() == "GET":
            if params is None:
                params = {}
            params['token'] = self.token
            request_args['params'] = params
        elif method.upper() == "POST":
            if data is None:
                data = {}
            data['token'] = self.token
            # Send as JSON, which was working
            request_args['json'] = data

        try:
            response = requests.request(method, url, **request_args)
            response.raise_for_status()

            # For successful POST, MechanicDesk returns HTML, not JSON.
            # We just need to know it was successful.
            if method.upper() == "POST" and response.ok:
                return {"status": "success", "message": "Booking request sent successfully."}

            try:
                return response.json()
            except JSONDecodeError:
                logger.error("MechanicDesk returned non-JSON response for %s %s: %s", method, url, response.text)
                return {"error": "Received non-JSON response from external service", "details": response.text}
        except requests.exceptions.HTTPError as e:
            logger.error("MechanicDesk HTTP error for %s %s: %s — %s", method, url, e.response.status_code, e.response.text)
            return {"error": f"An error occurred: {e}", "details": e.response.text}
        except requests.exceptions.RequestException as e:
            logger.error("MechanicDesk request failed for %s %s: %s", method, url, e)
            return {"error": f"An error occurred: {e}"}

    def get_job_types(self):
        """
        Retrieves a list of available job types from MechanicDesk.
        """
        return self._make_request("GET", "booking_requests/available_job_types")

    def get_unavailable_days(self, in_days=30):
        """
        Retrieves a list of unavailable days from MechanicDesk.
        :param in_days: Number of days to look ahead (1-90).
        """
        params = {"in_days": in_days}
        return self._make_request("GET", "booking_requests/unavailable_days", params=params)

    def create_booking(self, booking_data):
        """
        Creates a new booking request in MechanicDesk.
        :param booking_data: A dictionary containing the booking details.
        """
        return self._make_request("POST", "booking_requests/create_booking", data=booking_data)
