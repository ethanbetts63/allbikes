import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from inventory.models import StockAlertSubscriber
from inventory.stock_alerts import eligible_scooters, send_next_campaign
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
def test_campaign_sends_each_active_subscriber_once_and_excludes_sent_listings(monkeypatch):
    scooter = MotorcycleFactory(condition='used', vehicle_type='scooter', status='for_sale')
    new_scooter = MotorcycleFactory(condition='new', vehicle_type='scooter', status='for_sale')
    demo_scooter = MotorcycleFactory(condition='demo', vehicle_type='scooter', status='for_sale')
    motorcycle = MotorcycleFactory(condition='used', vehicle_type='motorcycle', status='for_sale')
    excluded_scooter = MotorcycleFactory(
        condition='used', vehicle_type='scooter', status='for_sale', include_in_stock_alerts=False,
    )
    StockAlertSubscriber.objects.create(email='first@example.com')
    StockAlertSubscriber.objects.create(email='second@example.com')
    monkeypatch.setattr('inventory.stock_alerts._send_mailgun', lambda *args, **kwargs: None)

    campaign = send_next_campaign()

    assert campaign.status == 'sent'
    assert campaign.sent_count == 2
    assert set(campaign.items.values_list('motorcycle_id', flat=True)) == {scooter.id, new_scooter.id, demo_scooter.id, motorcycle.id}
    assert excluded_scooter.id not in campaign.items.values_list('motorcycle_id', flat=True)
    assert campaign.recipients.count() == 2
    assert Message.objects.filter(message_type='stock_alert_update', status='sent').count() == 2
    assert list(eligible_scooters()) == []


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
