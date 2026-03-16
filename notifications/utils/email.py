import logging

import requests
from django.conf import settings
from django.template.loader import render_to_string
from django.utils import timezone

from notifications.models import Message

logger = logging.getLogger(__name__)


def _send_mailgun(to, subject, html_body, text_body):
    requests.post(
        f"https://api.mailgun.net/v3/{settings.MAILGUN_DOMAIN}/messages",
        auth=("api", settings.MAILGUN_API_KEY),
        data={
            "from": settings.DEFAULT_FROM_EMAIL,
            "to": [to],
            "subject": subject,
            "text": text_body,
            "html": html_body,
        },
        timeout=10,
    ).raise_for_status()


def _record(obj, message_type, to, subject, body_text, body_html, status, error_message=''):
    try:
        Message.objects.create(
            content_object=obj,
            message_type=message_type,
            channel='email',
            to=to,
            subject=subject,
            body_text=body_text,
            body_html=body_html,
            status=status,
            error_message=error_message,
            sent_at=timezone.now() if status == 'sent' else None,
        )
    except Exception as e:
        logger.error("Failed to record sent message (%s): %s", message_type, e)


def _effective_price(product):
    return product.discount_price if product.discount_price else product.price


def send_customer_confirmation(order):
    to = order.customer_email

    if order.payment_type == 'deposit':
        subject = f"Deposit confirmed — {order.order_reference}"
        motorcycle_name = str(order.motorcycle)
        text_body = (
            f"Hi {order.customer_name},\n\n"
            f"Your deposit has been received and {motorcycle_name} is now reserved for you.\n\n"
            f"Deposit reference: {order.order_reference}\n"
            f"Motorcycle: {motorcycle_name}\n"
            f"Deposit paid: ${order.amount_paid}\n\n"
            f"Our team will be in touch shortly to discuss next steps.\n\n"
            f"Questions? Contact us at info@scootershop.com.au"
        )
    else:
        subject = f"Order confirmed — {order.order_reference}"
        price = _effective_price(order.product)
        text_body = (
            f"Hi {order.customer_name},\n\n"
            f"Your ScooterShop order has been confirmed!\n\n"
            f"Order reference: {order.order_reference}\n"
            f"Product: {order.product.name}\n"
            f"Price: ${price} incl. GST · Free delivery Australia-wide\n"
            f"Delivery to: {order.address_line1}, {order.suburb} {order.state} {order.postcode}\n"
            f"Contact: {order.customer_email}"
            + (f" / {order.customer_phone}" if order.customer_phone else "")
            + f"\n\nWe'll be in touch when your order is dispatched.\n\nThank you for shopping with ScooterShop!"
        )

    context = {'order': order}
    html_body = render_to_string('notifications/emails/customer_confirmation.html', context)

    try:
        _send_mailgun(to=to, subject=subject, html_body=html_body, text_body=text_body)
        _record(order, 'customer_confirmation', to, subject, text_body, html_body, 'sent')
    except Exception as e:
        logger.error("Failed to send customer confirmation for order %s: %s", order.order_reference, e)
        _record(order, 'customer_confirmation', to, subject, text_body, html_body, 'failed', str(e))


def send_admin_new_order(order):
    admin_email = getattr(settings, 'ADMIN_EMAIL', None)
    if not admin_email:
        logger.warning(
            "ADMIN_EMAIL not configured — skipping admin new order notification for %s",
            order.order_reference,
        )
        return

    to = admin_email

    if order.payment_type == 'deposit':
        subject = f"New deposit — {order.order_reference}"
        motorcycle_name = str(order.motorcycle)
        text_body = (
            f"New deposit received: {order.order_reference}\n"
            f"Date: {timezone.localtime(order.created_at).strftime('%d %b %Y, %I:%M %p')} AWST\n\n"
            f"Motorcycle: {motorcycle_name}\n"
            f"Deposit: ${order.amount_paid}\n\n"
            f"Customer: {order.customer_name}\n"
            f"Email: {order.customer_email}\n"
            f"Phone: {order.customer_phone or 'not provided'}\n"
        )
    else:
        subject = f"New ScooterShop order — {order.order_reference}"
        price = _effective_price(order.product)
        text_body = (
            f"New order received: {order.order_reference}\n"
            f"Date: {timezone.localtime(order.created_at).strftime('%d %b %Y, %I:%M %p')} AWST\n\n"
            f"Product: {order.product.name}\n"
            f"Price: ${price} incl. GST\n\n"
            f"Customer: {order.customer_name}\n"
            f"Email: {order.customer_email}\n"
            f"Phone: {order.customer_phone or 'not provided'}\n"
            f"Address: {order.address_line1}, {order.suburb} {order.state} {order.postcode}\n"
        )

    context = {'order': order}
    html_body = render_to_string('notifications/emails/admin_new_order.html', context)

    try:
        _send_mailgun(to=to, subject=subject, html_body=html_body, text_body=text_body)
        _record(order, 'admin_new_order', to, subject, text_body, html_body, 'sent')
    except Exception as e:
        logger.error("Failed to send admin new order notification for order %s: %s", order.order_reference, e)
        _record(order, 'admin_new_order', to, subject, text_body, html_body, 'failed', str(e))
