import logging

import requests
from django.conf import settings
from django.template.loader import render_to_string
from django.utils import timezone

from notifications.models import Message
from notifications.utils import sms_messages

logger = logging.getLogger(__name__)


def _send_admin_sms(body):
    if settings.DEBUG:
        logger.info("DEBUG mode: skipping admin SMS")
        return
    numbers = getattr(settings, 'ADMIN_NUMBERS', [])
    if not numbers:
        logger.warning("ADMIN_NUMBERS not configured — skipping admin SMS")
        return
    from twilio.rest import Client
    client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
    for number in numbers:
        try:
            client.messages.create(
                body=body,
                messaging_service_sid=settings.TWILIO_MESSAGING_SERVICE_SID,
                to=number,
            )
        except Exception as e:
            logger.error("Failed to send admin SMS to %s: %s", number, e)


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


def _admin_recipients():
    recipients = getattr(settings, 'ADMIN_EMAILS', None)
    if isinstance(recipients, str):
        return [email.strip() for email in recipients.split(',') if email.strip()]
    if recipients:
        return [email.strip() for email in recipients if email and email.strip()]

    admin_email = getattr(settings, 'ADMIN_EMAIL', None)
    return [admin_email.strip()] if admin_email and admin_email.strip() else []


def _record(obj, message_type, to, subject, body_text, body_html, status, error_message=''):
    try:
        logger.info(
            "Recording message type=%s to=%s status=%s object=%s:%s",
            message_type,
            to,
            status,
            obj.__class__.__name__ if obj else 'None',
            getattr(obj, 'pk', None),
        )
        message = Message.objects.create(
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
        logger.info("Recorded message id=%s", message.pk)
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
            f"Our team will be in touch as soon as possible to organise pickup.\n\n"
            f"Questions? Contact us at admin@scootershop.com.au"
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


def send_hire_confirmation(booking):
    to = booking.customer_email
    subject = f"Hire booking confirmed — {booking.booking_reference}"
    text_body = (
        f"Hi {booking.customer_name},\n\n"
        f"Your hire booking has been confirmed.\n\n"
        f"Booking reference: {booking.booking_reference}\n"
        f"Motorcycle: {booking.motorcycle}\n"
        f"Pick-up: {booking.hire_start.strftime('%d %b %Y')}\n"
        f"Return: {booking.hire_end.strftime('%d %b %Y')}\n"
        f"Duration: {booking.num_days} {'day' if booking.num_days == 1 else 'days'}\n"
        f"Hire: ${booking.total_hire_amount}\n"
        + (f"Bond (refundable): ${booking.bond_amount}\n" if booking.bond_amount else "")
        + f"Total charged: ${booking.total_charged}\n\n"
        f"PICK-UP & DROP-OFF\n"
        f"Pick-up: Collect your bike any time we are open on {booking.hire_start.strftime('%d %b %Y')}.\n"
        f"Drop-off: Return the bike at least 2 hours before closing time on {booking.hire_end.strftime('%d %b %Y')}.\n\n"
        f"Unit 5 / 6 Cleveland Street, Dianella WA 6059\n"
        f"Mon-Fri: 9:00 AM - 5:00 PM | Sat: 10:00 AM - 1:00 PM | Sun: Closed\n\n"
        f"Questions? Contact us at admin@scootershop.com.au"
    )
    context = {'booking': booking}
    html_body = render_to_string('notifications/emails/hire_customer_confirmation.html', context)
    try:
        _send_mailgun(to=to, subject=subject, html_body=html_body, text_body=text_body)
        _record(booking, 'hire_confirmation', to, subject, text_body, html_body, 'sent')
    except Exception as e:
        logger.error("Failed to send hire confirmation for booking %s: %s", booking.booking_reference, e)
        _record(booking, 'hire_confirmation', to, subject, text_body, html_body, 'failed', str(e))


def send_admin_new_hire(booking):
    recipients = _admin_recipients()
    if not recipients:
        logger.warning(
            "ADMIN_EMAIL not configured — skipping admin new hire notification for %s",
            booking.booking_reference,
        )
        return
    subject = f"New hire booking — {booking.booking_reference}"
    text_body = (
        f"New hire booking: {booking.booking_reference}\n"
        f"Date: {timezone.localtime(booking.created_at).strftime('%d %b %Y, %I:%M %p')} AWST\n\n"
        f"Motorcycle: {booking.motorcycle}\n"
        f"Pick-up: {booking.hire_start.strftime('%d %b %Y')}\n"
        f"Return: {booking.hire_end.strftime('%d %b %Y')}\n"
        f"Duration: {booking.num_days} {'day' if booking.num_days == 1 else 'days'}\n"
        f"Hire total: ${booking.total_hire_amount}\n\n"
        f"Customer: {booking.customer_name}\n"
        f"Phone: {booking.customer_phone}\n"
        f"Email: {booking.customer_email}\n\n"
        f"Contact the customer to confirm pickup details.\n"
    )
    context = {'booking': booking}
    html_body = render_to_string('notifications/emails/hire_admin_new_booking.html', context)
    for to in recipients:
        try:
            _send_mailgun(to=to, subject=subject, html_body=html_body, text_body=text_body)
            _record(booking, 'admin_new_hire', to, subject, text_body, html_body, 'sent')
        except Exception as e:
            logger.error("Failed to send admin new hire notification for booking %s to %s: %s", booking.booking_reference, to, e)
            _record(booking, 'admin_new_hire', to, subject, text_body, html_body, 'failed', str(e))
    _send_admin_sms(sms_messages.admin_new_hire(booking))


def send_service_booking_confirmation(booking_data, booking_log=None):
    to = booking_data.get('email')
    if not to:
        logger.warning("Service booking customer email skipped: missing recipient")
        return
    first_name = booking_data.get('first_name', '')
    make = booking_data.get('make', '')
    model = booking_data.get('model', '')
    subject = f"Service booking request received — {make} {model}".strip()
    text_body = (
        f"Hi {first_name},\n\n"
        f"We've received your service request and will be in touch shortly to confirm your drop-off time.\n\n"
        f"Motorcycle: {make} {model}\n"
        f"Rego: {booking_data.get('registration_number', '')}\n"
        f"Services: {', '.join(booking_data.get('job_type_names', []))}\n"
        f"Requested drop-off: {booking_data.get('drop_off_time', '')}\n\n"
        f"Cancellation policy: Cancellations with less than 5 days notice may incur acancellation fee.\n\n"
        f"Unit 5 / 6 Cleveland Street, Dianella WA 6059\n"
        f"admin@scootershop.com.au | 08 9433 4613"
    )
    context = {'booking_data': booking_data}
    html_body = render_to_string('notifications/emails/service_booking_confirmation.html', context)
    try:
        logger.info(
            "Sending service customer email to=%s booking_log_id=%s subject=%s",
            to,
            getattr(booking_log, 'pk', None),
            subject,
        )
        _send_mailgun(to, subject, html_body, text_body)
        _record(booking_log, 'service_booking_confirmation', to, subject, text_body, html_body, 'sent')
        logger.info("Service booking confirmation sent to %s", to)
    except Exception as e:
        logger.error("Failed to send service booking confirmation to %s: %s", to, e)
        _record(booking_log, 'service_booking_confirmation', to, subject, text_body, html_body, 'failed', str(e))


def send_admin_service_booking(booking_data, booking_log=None):
    recipients = _admin_recipients()
    customer_name = booking_data.get('name') or f"{booking_data.get('first_name', '')} {booking_data.get('last_name', '')}".strip()
    registration = booking_data.get('registration_number', '')

    if not recipients:
        logger.warning(
            "No admin emails configured - skipping admin service booking notification for %s",
            registration or customer_name or "unknown booking",
        )
        return

    make = booking_data.get('make', '')
    model = booking_data.get('model', '')
    subject = f"New service booking request - {make} {model}".strip()
    text_body = (
        f"New service booking request\n"
        f"Customer: {customer_name}\n"
        f"Phone: {booking_data.get('phone', '')}\n"
        f"Email: {booking_data.get('email', '')}\n\n"
        f"Motorcycle: {make} {model}\n"
        f"Rego: {registration}\n"
        f"Services: {', '.join(booking_data.get('job_type_names', []))}\n"
        f"Requested drop-off: {booking_data.get('drop_off_time', '')}\n"
        f"Courtesy vehicle: {booking_data.get('courtesy_vehicle_requested', '')}\n\n"
        f"Note:\n{booking_data.get('note', '')}"
    )
    context = {'booking_data': booking_data, 'customer_name': customer_name}
    html_body = render_to_string('notifications/emails/admin_service_booking.html', context)

    for to in recipients:
        try:
            logger.info(
                "Sending admin service email to=%s booking_log_id=%s subject=%s",
                to,
                getattr(booking_log, 'pk', None),
                subject,
            )
            _send_mailgun(to=to, subject=subject, html_body=html_body, text_body=text_body)
            _record(booking_log, 'admin_service_booking', to, subject, text_body, html_body, 'sent')
        except Exception as e:
            logger.error("Failed to send admin service booking notification to %s: %s", to, e)
            _record(booking_log, 'admin_service_booking', to, subject, text_body, html_body, 'failed', str(e))
    _send_admin_sms(sms_messages.admin_new_service(booking_data))


def send_admin_new_order(order):
    recipients = _admin_recipients()
    if not recipients:
        logger.warning(
            "ADMIN_EMAIL not configured — skipping admin new order notification for %s",
            order.order_reference,
        )
        return

    if order.payment_type == 'deposit':
        subject = f"New deposit — {order.order_reference}"
        motorcycle_name = str(order.motorcycle)
        text_body = (
            f"New deposit received: {order.order_reference}\n"
            f"Date: {timezone.localtime(order.created_at).strftime('%d %b %Y, %I:%M %p')} AWST\n\n"
            f"Motorcycle: {motorcycle_name}\n"
            f"Deposit: ${order.amount_paid}\n\n"
            f"Customer: {order.customer_name}\n"
            f"Phone: {order.customer_phone}\n"
            f"Email: {order.customer_email}\n\n"
            f"Contact the customer to organise pickup.\n"
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

    for to in recipients:
        try:
            _send_mailgun(to=to, subject=subject, html_body=html_body, text_body=text_body)
            _record(order, 'admin_new_order', to, subject, text_body, html_body, 'sent')
        except Exception as e:
            logger.error("Failed to send admin new order notification for order %s to %s: %s", order.order_reference, to, e)
            _record(order, 'admin_new_order', to, subject, text_body, html_body, 'failed', str(e))
    _send_admin_sms(sms_messages.admin_new_order(order))
