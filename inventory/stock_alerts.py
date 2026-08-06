"""Vehicle stock-alert queue, rendering, and delivery."""
from urllib.parse import urljoin

from django.conf import settings
from django.db import transaction
from django.db.models import Prefetch
from django.template.loader import render_to_string
from django.utils import timezone

from inventory.models import Motorcycle, MotorcycleImage, StockAlertSubscriber
from notifications.models import Message
from notifications.utils.email import _send_mailgun

STOCK_ALERT_SUBJECT = 'New motorcycles and scooters just added to our stock'


def _absolute_media_url(url):
    if not url:
        return ''
    return url if url.startswith(('http://', 'https://')) else urljoin(settings.API_URL, url)


def _price_label(bike):
    price = bike.discount_price or bike.price
    return f'${price:,.0f}' if price is not None else 'Price on request'


def _details(bike):
    values = []
    if bike.odometer:
        values.append(f'{bike.odometer:,} km')
    if bike.engine_size:
        values.append(f'{bike.engine_size}cc')
    if bike.transmission:
        values.append(bike.get_transmission_display())
    return ' · '.join(values)


def eligible_bikes():
    """The mailing-list queue is defined solely by the listing's opt-in field."""
    return Motorcycle.objects.filter(include_in_stock_alerts=True).prefetch_related(
        Prefetch('images', queryset=MotorcycleImage.objects.order_by('order', 'id'), to_attr='stock_alert_images'),
    ).order_by('-date_posted', '-id')


def item_snapshot(bike, position):
    primary = bike.stock_alert_images[0] if bike.stock_alert_images else None
    image_url = _absolute_media_url(primary.medium.url if primary else '')
    return {
        'id': bike.id,
        'position': position,
        'title': str(bike),
        'listing_url': f'{settings.SITE_URL}/inventory/motorcycles/{bike.slug}',
        'image_url': image_url,
        'price_label': _price_label(bike),
        'details': _details(bike),
        'deposit_url': f'{settings.SITE_URL}/checkout/{bike.slug}?type=deposit',
    }


def queue_items(bikes):
    return [item_snapshot(bike, position) for position, bike in enumerate(bikes, start=1)]


def preview_data(items=None):
    items = items if items is not None else queue_items(list(eligible_bikes()))
    return {
        'subject': STOCK_ALERT_SUBJECT,
        'items': items,
        'recipient_count': StockAlertSubscriber.objects.filter(status='active').count(),
        'html': render_to_string('notifications/emails/stock_alert_update.html', {
            'items': items,
            'unsubscribe_url': f'{settings.SITE_URL}/used-stock/unsubscribe/preview',
        }),
        'text': _text_body(items, f'{settings.SITE_URL}/used-stock/unsubscribe/preview'),
    }


def _text_body(items, unsubscribe_url):
    lines = ['New motorcycles and scooters have just been added to ScooterShop stock.', '']
    for item in items:
        lines.extend([
            item['title'], item['price_label'], item['details'],
            f"View: {item['listing_url']}", f"Place a deposit: {item['deposit_url']}", '',
        ])
    lines.extend([
        'You are receiving this because you asked for motorcycle and scooter stock alerts.',
        f'Unsubscribe: {unsubscribe_url}',
        'ScooterShop · Allbikes & Scooters, Dianella WA · admin@scootershop.com.au',
    ])
    return '\n'.join(line for line in lines if line is not None)


def _email_html(items, subscriber):
    unsubscribe_url = f'{settings.SITE_URL}/used-stock/unsubscribe/{subscriber.unsubscribe_token}'
    return render_to_string('notifications/emails/stock_alert_update.html', {
        'items': items,
        'unsubscribe_url': unsubscribe_url,
    }), unsubscribe_url


def send_next_stock_alert():
    """Send the current field-controlled queue and clear it once at least one email sends."""
    with transaction.atomic():
        bikes = list(eligible_bikes().select_for_update())
        subscribers = list(StockAlertSubscriber.objects.select_for_update().filter(status='active'))
        if not bikes:
            raise ValueError('There are no listings selected for the next stock update.')
        if not subscribers:
            raise ValueError('There are no active subscribers to send to.')

        items = queue_items(bikes)
        sent_count = 0
        failed_count = 0
        for subscriber in subscribers:
            html_body, unsubscribe_url = _email_html(items, subscriber)
            text_body = _text_body(items, unsubscribe_url)
            try:
                _send_mailgun(subscriber.email, STOCK_ALERT_SUBJECT, html_body, text_body)
                Message.objects.create(
                    stock_alert_subscriber=subscriber,
                    message_type='stock_alert_update',
                    channel='email',
                    to=subscriber.email,
                    subject=STOCK_ALERT_SUBJECT,
                    body_text=text_body,
                    body_html=html_body,
                    status='sent',
                    sent_at=timezone.now(),
                )
                sent_count += 1
            except Exception as exc:
                Message.objects.create(
                    stock_alert_subscriber=subscriber,
                    message_type='stock_alert_update',
                    channel='email',
                    to=subscriber.email,
                    subject=STOCK_ALERT_SUBJECT,
                    body_text=text_body,
                    body_html=html_body,
                    status='failed',
                    error_message=str(exc),
                )
                failed_count += 1

        # This is deliberately the only state that prevents a listing appearing next time.
        if sent_count:
            Motorcycle.objects.filter(pk__in=[bike.id for bike in bikes]).update(include_in_stock_alerts=False)

    return {'sent_count': sent_count, 'failed_count': failed_count}
