from io import BytesIO

import pytest
from PIL import Image, ImageDraw
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework.test import APIClient

from inventory.models import MotorcycleImage, StockAlertSubscriber
from inventory.stock_alerts import eligible_bikes, item_snapshot, send_next_stock_alert
from inventory.tests.factories.motorcycle_factory import MotorcycleFactory
from inventory.tests.factories.motorcycle_image_factory import MotorcycleImageFactory
from notifications.models import Message
from data_management.tests.factories.user_factory import UserFactory


def _cutout_upload(width=900, height=800):
    """A product-style cut-out: an opaque subject on a transparent, white-under-the-alpha surround.

    The source has to be larger than the email variant for this to be a fair test.
    Downscaling is what zeroes the RGB of fully transparent pixels, so a cut-out that
    is never resized would pass even against the broken pipeline.
    """
    image = Image.new('RGBA', (width, height), (255, 255, 255, 0))
    ImageDraw.Draw(image).ellipse((150, 120, width - 150, height - 120), fill=(18, 38, 120, 255))
    buffer = BytesIO()
    image.save(buffer, format='PNG')
    return SimpleUploadedFile('cutout.png', buffer.getvalue(), content_type='image/png')


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
    monkeypatch.setattr('inventory.stock_alerts._send_mailgun', lambda *args, **kwargs: None)

    result = send_next_stock_alert()

    assert result == {'sent_count': 2, 'failed_count': 0}
    assert Message.objects.filter(message_type='stock_alert_update', status='sent').count() == 2
    assert Message.objects.filter(message_type='stock_alert_update', content_type__isnull=False).count() == 0
    assert set(Message.objects.filter(message_type='stock_alert_update').values_list('stock_alert_subscriber_id', flat=True)) == set(StockAlertSubscriber.objects.values_list('id', flat=True))
    assert set(eligible_bikes()) == set()
    scooter.refresh_from_db()
    hidden_parts_bike.refresh_from_db()
    excluded_bike.refresh_from_db()
    assert scooter.include_in_stock_alerts is False
    assert hidden_parts_bike.include_in_stock_alerts is False
    assert excluded_bike.include_in_stock_alerts is False


@pytest.mark.django_db
def test_stock_alert_image_is_opaque_and_matted_onto_white(settings, tmp_path):
    """Cut-outs have to reach the inbox with no alpha channel left to misread.

    Resizing an RGBA image zeroes the RGB of its fully transparent pixels, so a
    variant that keeps its alpha is a black rectangle to any client or image proxy
    that drops the channel.
    """
    settings.MEDIA_ROOT = str(tmp_path)
    MotorcycleImageFactory(image=_cutout_upload())

    variant = MotorcycleImage.objects.get().email
    variant.generate()
    with variant.open() as handle:
        rendered = Image.open(handle)
        rendered.load()

    assert rendered.format == 'JPEG'
    assert rendered.mode == 'RGB'
    assert 'A' not in rendered.getbands()
    # The corner sits in what used to be the transparent surround.
    assert min(rendered.getpixel((0, 0))) > 240
    assert max(rendered.size) <= 800


@pytest.mark.django_db
def test_stock_alert_item_uses_the_flattened_email_variant(settings, tmp_path):
    settings.MEDIA_ROOT = str(tmp_path)
    bike = MotorcycleFactory()
    image = MotorcycleImageFactory(motorcycle=bike, image=_cutout_upload())

    item = item_snapshot(next(iter(eligible_bikes())), 1)

    assert item['image_url'].endswith(image.email.url)
    assert item['image_url'].endswith('.jpg')


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
