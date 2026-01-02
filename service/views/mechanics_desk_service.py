import requests
from django.conf import settings


class MechanicsDeskService:
    BASE_URL = "https://www.mechanicdesk.com.au"

    def __init__(self):
        self.token = settings.MECHANICDESK_BOOKING_TOKEN

    def _make_request(self, method, endpoint, params=None, data=None):
        """Helper method to make requests to the MechanicDesk API."""
        if not self.token:
            # Handle case where token is not set
            return {"error": "MechanicDesk API token is not configured."}

        url = f"{self.BASE_URL}/{endpoint}"
        
        # Add the token to the request
        if method.upper() == "GET":
            if params is None:
                params = {}
            params['token'] = self.token
        elif method.upper() == "POST":
            if data is None:
                data = {}
            data['token'] = self.token

        try:
            response = requests.request(method, url, params=params, json=data)
            response.raise_for_status()  # Raise an exception for bad status codes (4xx or 5xx)
            return response.json()
        except requests.exceptions.RequestException as e:
            # Handle network errors
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

