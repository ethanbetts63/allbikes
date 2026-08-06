import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from inventory.models import StockAlertSubscriber
from inventory.stock_alerts import eligible_bikes, send_next_stock_alert
from inventory.tests.factories.motorcycle_factory import MotorcycleFactory
from notifications.models import Message
from data_management.tests.factories.user_factory import UserFactory


@pytest.mark.django_db
def test_public_signup_is_idempotent_and_reactivates_an_unsubscribed_email():
    client = APIClient()
    url = reverse('inventory:stock-alert-subscribe')

    assert client.post(url, {'email': 'Customer@Example.com'}, format='json').status_code == 201
    subscriber = StockAlertSubscriber.objects.get()
    assert subscriber.email == 'customer@example.com'
    subscriber.unsubscribe()

    assert client.post(url, {'email': 'customer@example.com'}, format='json').status_code == 200
    subscriber.refresh_from_db()
    assert subscriber.status == 'active'
    assert subscriber.unsubscribed_at is None


@pytest.mark.django_db
def test_public_signup_is_rate_limited():
    from django.core.cache import cache

    cache.clear()
    client = APIClient()
    url = reverse('inventory:stock-alert-subscribe')

    for number in range(5):
        assert client.post(url, {'email': f'customer{number}@example.com'}, format='json').status_code == 201

    assert client.post(url, {'email': 'too-many@example.com'}, format='json').status_code == 429


@pytest.mark.django_db
def test_stock_alert_send_uses_only_the_listing_flag_and_clears_it(monkeypatch):
    scooter = MotorcycleFactory(condition='used', vehicle_type='scooter', status='for_sale')
    hidden_parts_bike = MotorcycleFactory(condition='parts', vehicle_type='motorcycle', status='hide')
    excluded_bike = MotorcycleFactory(include_in_stock_alerts=False)
    StockAlertSubscriber.objects.create(email='first@example.com')
    StockAlertSubscriber.objects.create(email='second@example.com')
    monkeypatch.setattr('inventory.stock_alerts._send_mailgun', lambda *args, **kwargs: '<stock-alert@mailgun.test>')

    result = send_next_stock_alert()

    assert result == {'sent_count': 2, 'failed_count': 0}
    assert Message.objects.filter(message_type='stock_alert_update', status='sent').count() == 2
    assert Message.objects.filter(message_type='stock_alert_update', content_type__isnull=False).count() == 0
    assert Message.objects.filter(message_type='stock_alert_update', provider_message_id='<stock-alert@mailgun.test>').count() == 2
    assert set(Message.objects.filter(message_type='stock_alert_update').values_list('stock_alert_subscriber_id', flat=True)) == set(StockAlertSubscriber.objects.values_list('id', flat=True))
    assert set(eligible_bikes()) == set()
    scooter.refresh_from_db()
    hidden_parts_bike.refresh_from_db()
    excluded_bike.refresh_from_db()
    assert scooter.include_in_stock_alerts is False
    assert hidden_parts_bike.include_in_stock_alerts is False
    assert excluded_bike.include_in_stock_alerts is False


@pytest.mark.django_db
def test_admin_preview_is_json_serializable():
    opted_in = MotorcycleFactory(condition='new', vehicle_type='scooter', status='for_sale')
    MotorcycleFactory(condition='new', vehicle_type='scooter', status='for_sale', include_in_stock_alerts=False)
    user = UserFactory(is_staff=True)
    client = APIClient()
    client.force_authenticate(user=user)

    response = client.get(reverse('inventory:admin-stock-alerts'))

    assert response.status_code == 200
    assert response.data['preview']['items'][0]['title']
    assert response.data['preview']['items'][0]['deposit_url'] == f'https://www.scootershop.com.au/checkout/{opted_in.slug}?type=deposit'
    assert 'Place a deposit' in response.data['preview']['html']
    assert [bike['id'] for bike in response.data['included_bikes']] == [opted_in.id]
    assert response.data['included_bikes'][0]['price_label'].startswith('$')
