import pytest
from datetime import timedelta
from unittest.mock import patch
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from service.tests.factories import ServiceSettingsFactory, BlockedDateFactory
from service.utils.blocked_days import compute_local_unavailable_days


@pytest.mark.django_db
class TestLocalUnavailableDays:
    def test_advance_notice_and_explicit_block(self):
        ServiceSettingsFactory(
            use_mechanic_desk_blocked_dates=False,
            booking_advance_notice=2,
            always_blocked_weekdays="",
        )
        today = timezone.localdate()
        far_block = today + timedelta(days=10)
        BlockedDateFactory(date=far_block)

        result = compute_local_unavailable_days(in_days=30)
        days = result['unavailable_days']

        # Within the advance-notice window (today, today+1) are blocked.
        assert today.isoformat() in days
        assert (today + timedelta(days=1)).isoformat() in days
        # First bookable day (today+2) is not blocked.
        assert (today + timedelta(days=2)).isoformat() not in days
        # The explicit one-off block appears.
        assert far_block.isoformat() in days

    def test_weekday_rule(self):
        ServiceSettingsFactory(
            use_mechanic_desk_blocked_dates=False,
            booking_advance_notice=0,
            always_blocked_weekdays="6",  # Sundays
        )
        result = compute_local_unavailable_days(in_days=30)
        # Every Sunday in the window should be present.
        today = timezone.localdate()
        sundays = [
            (today + timedelta(days=i)).isoformat()
            for i in range(31)
            if (today + timedelta(days=i)).weekday() == 6
        ]
        for sunday in sundays:
            assert sunday in result['unavailable_days']

    @patch('service.views.booking_viewset.MechanicsDeskService')
    def test_endpoint_uses_local_when_toggle_off(self, mock_md):
        client = APIClient()
        ServiceSettingsFactory(use_mechanic_desk_blocked_dates=False, booking_advance_notice=1)
        response = client.get(reverse('service_api:unavailable-days'))
        assert response.status_code == status.HTTP_200_OK
        assert 'unavailable_days' in response.data
        # MechanicDesk must NOT be queried when the toggle is off.
        mock_md.return_value.get_unavailable_days.assert_not_called()
