# Notifications

The `notifications` Django app sends Mailgun email, optional Twilio admin SMS,
and records every attempted message in `notifications.Message`.

## Domain-specific functions

Order notifications are explicit; there is no mixed-order dispatcher or
`payment_type` branch:

- `send_product_customer_confirmation` / `send_product_admin_new_order`
- `send_bike_customer_confirmation` / `send_bike_admin_new_order`
- `send_hire_confirmation` / `send_admin_new_hire`
- `send_parts_customer_confirmation` / `send_parts_admin_new_order`
- Service and parts workflow functions remain domain-specific as well.

The Stripe webhook calls the relevant pair after a successful database
transaction. Mailgun failures are caught, logged and recorded as failed Message
rows rather than changing payment success.

## Message records

`Message` uses Django content types to associate an email/SMS with its product
order, bike order, hire booking, parts order or service record. It stores the
recipient, subject, text/HTML bodies, channel, delivery status, timestamps and
error details.

## Templates

Current paid-order templates are:

- `product_order_confirmation.html`
- `product_admin_new_order.html`
- `bike_order_confirmation.html`
- `bike_admin_new_order.html`
- `hire_customer_confirmation.html`
- `hire_admin_new_booking.html`
- `parts_customer_confirmation.html`
- `parts_admin_new_order.html`

All extend `notifications/emails/base.html`.

## Commands

`python manage.py send_admin_reminders` sends the weekly product/bike admin
summary. `python manage.py send_test_email --template <name>` can preview the
current product/bike templates; run `--help` for the available choices.

Required configuration includes `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`,
`DEFAULT_FROM_EMAIL` and `ADMIN_EMAILS`. SMS additionally requires the Twilio
credentials and admin phone numbers.
