import pytest
from datetime import timedelta
from unittest.mock import patch
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from service.tests.factories import ServiceSettingsFactory, BlockedDateFactory


@pytest.fixture
def admin_client():
    user = User.objects.create_superuser('admin', 'admin@example.com', 'password')
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.mark.django_db
class TestDiaryUnavailableDaysView:
    def test_requires_admin(self):
        client = APIClient()
        client.force_authenticate(user=User.objects.create_user('u', 'u@e.com', 'p'))
        response = client.get('/api/service/admin/unavailable-days/?start=2026-01-01&end=2026-01-07')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_requires_start_and_end(self, admin_client):
        response = admin_client.get('/api/service/admin/unavailable-days/')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_local_mode_returns_range(self, admin_client):
        ServiceSettingsFactory(
            use_mechanic_desk_blocked_dates=False,
            booking_advance_notice=0,
            always_blocked_weekdays="",
        )
        today = timezone.localdate()
        blocked = today + timedelta(days=3)
        BlockedDateFactory(date=blocked)

        start = today.isoformat()
        end = (today + timedelta(days=6)).isoformat()
        response = admin_client.get(f'/api/service/admin/unavailable-days/?start={start}&end={end}')

        assert response.status_code == status.HTTP_200_OK
        assert blocked.isoformat() in response.data['unavailable_days']

    @patch('service.views.diary_unavailable_days_view.MechanicsDeskService')
    def test_md_mode_filters_to_range(self, mock_md, admin_client):
        ServiceSettingsFactory(use_mechanic_desk_blocked_dates=True)
        today = timezone.localdate()
        in_range = (today + timedelta(days=2)).isoformat()
        out_of_range = (today + timedelta(days=40)).isoformat()
        mock_md.return_value.get_unavailable_days.return_value = {
            'unavailable_days': [in_range, out_of_range]
        }

        start = today.isoformat()
        end = (today + timedelta(days=6)).isoformat()
        response = admin_client.get(f'/api/service/admin/unavailable-days/?start={start}&end={end}')

        assert response.status_code == status.HTTP_200_OK
        assert in_range in response.data['unavailable_days']
        assert out_of_range not in response.data['unavailable_days']

    def test_force_open_override_ungrays_day_in_local_mode(self, admin_client):
        ServiceSettingsFactory(
            use_mechanic_desk_blocked_dates=False,
            booking_advance_notice=3,
            always_blocked_weekdays="",
        )
        today = timezone.localdate()
        exception_day = today + timedelta(days=1)  # inside advance-notice window
        start = today.isoformat()
        end = (today + timedelta(days=6)).isoformat()

        # Greyed before the override.
        before = admin_client.get(f'/api/service/admin/unavailable-days/?start={start}&end={end}')
        assert exception_day.isoformat() in before.data['unavailable_days']

        # Admin forces the day open.
        create = admin_client.post(
            '/api/service/admin/blocked-dates/',
            {'date': exception_day.isoformat(), 'available': True},
            format='json',
        )
        assert create.status_code in (status.HTTP_200_OK, status.HTTP_201_CREATED)
        assert create.data['available'] is True

        after = admin_client.get(f'/api/service/admin/unavailable-days/?start={start}&end={end}')
        assert exception_day.isoformat() not in after.data['unavailable_days']

    def test_posting_same_date_upserts_the_single_row(self, admin_client):
        ServiceSettingsFactory(use_mechanic_desk_blocked_dates=False)
        today = timezone.localdate()
        day = (today + timedelta(days=10)).isoformat()

        r1 = admin_client.post('/api/service/admin/blocked-dates/', {'date': day, 'available': False}, format='json')
        assert r1.status_code == status.HTTP_201_CREATED
        # Flip the same day to force-open — must update, not 400 on the unique date.
        r2 = admin_client.post('/api/service/admin/blocked-dates/', {'date': day, 'available': True}, format='json')
        assert r2.status_code == status.HTTP_200_OK
        assert r2.data['available'] is True

        listing = admin_client.get(f'/api/service/admin/blocked-dates/?start={day}&end={day}')
        assert len(listing.data) == 1

    @patch('service.views.diary_unavailable_days_view.MechanicsDeskService')
    def test_md_error_greys_nothing(self, mock_md, admin_client):
        ServiceSettingsFactory(use_mechanic_desk_blocked_dates=True)
        mock_md.return_value.get_unavailable_days.return_value = {'error': 'down'}
        today = timezone.localdate()
        start = today.isoformat()
        end = (today + timedelta(days=6)).isoformat()

        response = admin_client.get(f'/api/service/admin/unavailable-days/?start={start}&end={end}')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['unavailable_days'] == []
