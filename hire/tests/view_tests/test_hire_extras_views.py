import pytest
from datetime import date, timedelta
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from data_management.tests.factories.user_factory import UserFactory
from hire.models import HireBooking, HireBookingExtra
from hire.tests.factories.hire_extra_factory import HireExtraFactory
from hire.tests.factories.hire_booking_factory import HireBookingFactory


def _future(days):
    return str(date.today() + timedelta(days=days))


def _booking_payload(motorcycle_id, extras=None):
    payload = {
        'motorcycle': motorcycle_id,
        'hire_start': _future(3),
        'hire_end': _future(5),
        'customer_name': 'Jane Rider',
        'customer_email': 'jane@example.com',
        'customer_phone': '0400000000',
        'terms_accepted': True,
        'is_of_age': True,
        'extras': extras or [],
    }
    return payload


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def admin_client():
    client = APIClient()
    user = UserFactory(is_staff=True, is_superuser=True)
    client.force_authenticate(user=user)
    return client


# ---------------------------------------------------------------------------
# Public extras list
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestHireExtrasListView:

    URL = reverse('hire:hire-extras-list')

    def test_returns_active_extras(self, api_client):
        """
        GIVEN 2 active and 1 inactive extra
        WHEN GET /api/hire/extras/
        THEN only the 2 active extras are returned.
        """
        HireExtraFactory.create_batch(2, is_active=True)
        HireExtraFactory(is_active=False)
        response = api_client.get(self.URL)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2

    def test_returns_empty_when_no_extras(self, api_client):
        response = api_client.get(self.URL)
        assert response.status_code == status.HTTP_200_OK
        assert response.data == []


# ---------------------------------------------------------------------------
# Booking create with extras
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestHireBookingCreateWithExtras:

    URL = reverse('hire:hire-booking-create')

    def test_booking_without_extras_succeeds(self, api_client):
        from inventory.tests.factories.motorcycle_factory import MotorcycleFactory
        bike = MotorcycleFactory(is_hire=True, status='for_sale', daily_rate='100.00')
        response = api_client.post(self.URL, _booking_payload(bike.id), format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['extras_total'] == '0'

    def test_booking_with_extra_creates_booking_extra(self, api_client):
        """
        GIVEN a valid payload with one extra
        WHEN POST /api/hire/bookings/
        THEN a HireBookingExtra row is created with correct total_amount.
        """
        from inventory.tests.factories.motorcycle_factory import MotorcycleFactory
        bike = MotorcycleFactory(is_hire=True, status='for_sale', daily_rate='100.00')
        extra = HireExtraFactory(price_per_day='25.00')
        payload = _booking_payload(bike.id, extras=[{'extra_id': extra.id, 'quantity': 1}])
        response = api_client.post(self.URL, payload, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        booking = HireBooking.objects.first()
        assert booking.extras.count() == 1
        be = booking.extras.first()
        assert float(be.price_per_day_snapshot) == float(extra.price_per_day)
        # 3 days (start+3 to start+5 inclusive)
        assert float(be.total_amount) == 25.00 * 3

    def test_extras_total_included_in_response(self, api_client):
        from inventory.tests.factories.motorcycle_factory import MotorcycleFactory
        bike = MotorcycleFactory(is_hire=True, status='for_sale', daily_rate='100.00')
        extra = HireExtraFactory(price_per_day='20.00')
        payload = _booking_payload(bike.id, extras=[{'extra_id': extra.id, 'quantity': 1}])
        response = api_client.post(self.URL, payload, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert float(response.data['extras_total']) == 20.00 * 3

    def test_inactive_extra_returns_400(self, api_client):
        """
        GIVEN an inactive extra
        WHEN POST with that extra
        THEN 400 is returned.
        """
        from inventory.tests.factories.motorcycle_factory import MotorcycleFactory
        bike = MotorcycleFactory(is_hire=True, status='for_sale', daily_rate='100.00')
        extra = HireExtraFactory(is_active=False)
        payload = _booking_payload(bike.id, extras=[{'extra_id': extra.id, 'quantity': 1}])
        response = api_client.post(self.URL, payload, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_total_charged_includes_extras(self, api_client):
        """
        GIVEN a booking with an extra
        WHEN total_charged is accessed
        THEN it includes the extra total.
        """
        from inventory.tests.factories.motorcycle_factory import MotorcycleFactory
        bike = MotorcycleFactory(is_hire=True, status='for_sale', daily_rate='100.00')
        extra = HireExtraFactory(price_per_day='10.00')
        payload = _booking_payload(bike.id, extras=[{'extra_id': extra.id, 'quantity': 1}])
        api_client.post(self.URL, payload, format='json')
        booking = HireBooking.objects.first()
        # hire: 100*3=300, bond: from settings, extras: 10*3=30
        assert booking.total_charged == booking.total_hire_amount + booking.bond_amount + 30


# ---------------------------------------------------------------------------
# Admin extras CRUD
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestAdminHireExtraViews:

    LIST_URL = reverse('hire:admin-hire-extras-list')

    def test_admin_can_list_extras(self, admin_client):
        HireExtraFactory.create_batch(3)
        response = admin_client.get(self.LIST_URL)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 3

    def test_admin_can_create_extra(self, admin_client):
        response = admin_client.post(self.LIST_URL, {'name': 'Helmet', 'price_per_day': '15.00', 'is_active': True}, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['name'] == 'Helmet'

    def test_admin_can_patch_extra(self, admin_client):
        extra = HireExtraFactory(price_per_day='10.00')
        url = reverse('hire:admin-hire-extras-detail', kwargs={'pk': extra.pk})
        response = admin_client.patch(url, {'price_per_day': '20.00'}, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['price_per_day'] == '20.00'

    def test_admin_can_delete_extra(self, admin_client):
        extra = HireExtraFactory()
        url = reverse('hire:admin-hire-extras-detail', kwargs={'pk': extra.pk})
        response = admin_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_anonymous_cannot_access_admin_extras(self, api_client):
        response = api_client.get(self.LIST_URL)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
