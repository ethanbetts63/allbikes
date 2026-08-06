"""Vehicle stock-alert campaign selection, rendering, and delivery."""
from urllib.parse import urljoin

from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.db import transaction
from django.template.loader import render_to_string
from django.utils import timezone

from inventory.models import (
    Motorcycle,
    StockAlertCampaign,
    StockAlertCampaignItem,
    StockAlertCampaignRecipient,
    StockAlertSubscriber,
)
from notifications.models import Message
from notifications.utils.email import _send_mailgun

SITE_URL = 'https://www.scootershop.com.au'
API_URL = 'https://api.scootershop.com.au'
ELIGIBLE_CONDITIONS = ('new', 'demo', 'used')
FINISHED_CAMPAIGN_STATUSES = ('sending', 'sent', 'partial')


def _absolute_media_url(url):
    if not url:
        return ''
    return url if url.startswith(('http://', 'https://')) else urljoin(API_URL, url)


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


def eligible_scooters():
    """Eligible motorcycles and scooters never included in a stock-alert send."""
    return (
        Motorcycle.objects.filter(
            include_in_stock_alerts=True,
            condition__in=ELIGIBLE_CONDITIONS,
            vehicle_type__in=('scooter', 'motorcycle'),
            status='for_sale',
        )
        .exclude(stock_alert_items__campaign__status__in=FINISHED_CAMPAIGN_STATUSES)
        .prefetch_related('images')
        .order_by('-date_posted', '-id')
        .distinct()
    )


def item_snapshot(bike, position):
    primary = bike.images.order_by('order', 'id').first()
    image_url = _absolute_media_url(primary.medium.url if primary else '')
    return {
        'motorcycle': bike,
        'position': position,
        'title': str(bike),
        'listing_url': f'{SITE_URL}/inventory/motorcycles/{bike.slug}',
        'image_url': image_url,
        'price_label': _price_label(bike),
        'details': _details(bike),
    }


def _deposit_url(listing_url):
    slug = listing_url.rstrip('/').rsplit('/', 1)[-1]
    return f'{SITE_URL}/checkout/{slug}?type=deposit'


def _email_items(items):
    """Add presentation-only links to preview dictionaries; sent items use their model property."""
    return [
        {**item, 'deposit_url': _deposit_url(item['listing_url'])} if isinstance(item, dict) else item
        for item in items
    ]


def preview_data():
    items = [item_snapshot(bike, position) for position, bike in enumerate(eligible_scooters(), start=1)]
    email_items = _email_items(items)
    subject = 'New motorcycles and scooters just added to our stock'
    return {
        'subject': subject,
        'items': [{key: value for key, value in item.items() if key != 'motorcycle'} for item in email_items],
        'recipient_count': StockAlertSubscriber.objects.filter(status='active').count(),
        'html': render_to_string('notifications/emails/stock_alert_update.html', {
            'items': email_items,
            'unsubscribe_url': f'{SITE_URL}/used-stock/unsubscribe/preview',
        }),
        'text': _text_body(items, f'{SITE_URL}/used-stock/unsubscribe/preview'),
    }


def _text_body(items, unsubscribe_url):
    lines = ['New motorcycles and scooters have just been added to ScooterShop stock.', '']
    for item in items:
        if isinstance(item, dict):
            title = item['title']
            price_label = item['price_label']
            details = item['details']
            listing_url = item['listing_url']
            deposit_url = item.get('deposit_url') or _deposit_url(listing_url)
        else:
            title = item.title
            price_label = item.price_label
            details = item.details
            listing_url = item.listing_url
            deposit_url = item.deposit_url
        lines.extend([title, price_label, details, f'View: {listing_url}', f'Place a deposit: {deposit_url}', ''])
    lines.extend([
        'You are receiving this because you asked for motorcycle and scooter stock alerts.',
        f'Unsubscribe: {unsubscribe_url}',
        'ScooterShop · Allbikes & Scooters, Dianella WA · admin@scootershop.com.au',
    ])
    return '\n'.join(line for line in lines if line is not None)


def _email_html(items, subscriber):
    unsubscribe_url = f'{SITE_URL}/used-stock/unsubscribe/{subscriber.unsubscribe_token}'
    return render_to_string('notifications/emails/stock_alert_update.html', {
        'items': items,
        'unsubscribe_url': unsubscribe_url,
    }), unsubscribe_url


def send_next_campaign():
    """Snapshot and send the next eligible stock alert synchronously.

    Every recipient is independently recorded, so a partial failure is visible
    and the campaign remains an audit trail even if a request is interrupted.
    """
    with transaction.atomic():
        snapshots = [item_snapshot(bike, position) for position, bike in enumerate(eligible_scooters(), start=1)]
        subscribers = list(StockAlertSubscriber.objects.select_for_update().filter(status='active'))
        if not snapshots:
            raise ValueError('There are no new motorcycle or scooter listings to send.')
        if not subscribers:
            raise ValueError('There are no active subscribers to send to.')

        campaign = StockAlertCampaign.objects.create(
            subject='New motorcycles and scooters just added to our stock',
            status='sending',
            recipient_count=len(subscribers),
        )
        StockAlertCampaignItem.objects.bulk_create([
            StockAlertCampaignItem(campaign=campaign, **snapshot) for snapshot in snapshots
        ])
        StockAlertCampaignRecipient.objects.bulk_create([
            StockAlertCampaignRecipient(campaign=campaign, subscriber=subscriber, email=subscriber.email)
            for subscriber in subscribers
        ])

    items = list(campaign.items.all())
    recipients = list(
        StockAlertCampaignRecipient.objects.select_related('subscriber').filter(campaign=campaign)
    )
    content_type = ContentType.objects.get_for_model(campaign)
    sent_count = 0
    failed_count = 0
    for recipient in recipients:
        subscriber = recipient.subscriber
        if not subscriber or subscriber.status != 'active':
            recipient.status = 'failed'
            recipient.error_message = 'Subscriber is no longer active.'
            recipient.save(update_fields=['status', 'error_message'])
            failed_count += 1
            continue
        html_body, unsubscribe_url = _email_html(items, subscriber)
        text_body = _text_body(items, unsubscribe_url)
        try:
            _send_mailgun(recipient.email, campaign.subject, html_body, text_body)
            message = Message.objects.create(
                content_type=content_type,
                object_id=campaign.id,
                message_type='stock_alert_update',
                channel='email',
                to=recipient.email,
                subject=campaign.subject,
                body_text=text_body,
                body_html=html_body,
                status='sent',
                sent_at=timezone.now(),
            )
            recipient.status = 'sent'
            recipient.message = message
            recipient.sent_at = message.sent_at
            recipient.save(update_fields=['status', 'message', 'sent_at'])
            sent_count += 1
        except Exception as exc:
            message = Message.objects.create(
                content_type=content_type,
                object_id=campaign.id,
                message_type='stock_alert_update',
                channel='email',
                to=recipient.email,
                subject=campaign.subject,
                body_text=text_body,
                body_html=html_body,
                status='failed',
                error_message=str(exc),
            )
            recipient.status = 'failed'
            recipient.message = message
            recipient.error_message = str(exc)
            recipient.save(update_fields=['status', 'message', 'error_message'])
            failed_count += 1

    campaign.sent_count = sent_count
    campaign.failed_count = failed_count
    campaign.sent_at = timezone.now()
    campaign.status = 'sent' if failed_count == 0 else ('partial' if sent_count else 'failed')
    campaign.save(update_fields=['sent_count', 'failed_count', 'sent_at', 'status'])
    return campaign
