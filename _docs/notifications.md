# Notifications

Standalone Django app (`notifications/`) for sending and recording emails across the site. Uses the Mailgun API directly via `requests` — no additional email library needed. Built to be extended with SMS and additional notification types as the site grows.

---

## Environment Variables

All in `.env` in the project root, read in `settings.py`:

| Variable | Description |
|---|---|
| `MAILGUN_API_KEY` | Mailgun API key |
| `MAILGUN_DOMAIN` | Mailgun sending domain (sandbox or verified) |
| `ADMIN_EMAIL` | Where admin notifications are sent |
| `DEFAULT_FROM_EMAIL` | The `from` address on all outgoing emails (defaults to `noreply@scootershop.com.au`) |

---

## Architecture

Three notification types, two delivery timings:

### Immediate — fires inside the Stripe webhook handler

| Notification | Recipient | Trigger |
|---|---|---|
| Customer order confirmation | `order.customer_email` | `payment_intent.succeeded` webhook |
| Admin new order alert | `ADMIN_EMAIL` | `payment_intent.succeeded` webhook |

Both are called in `payments/utils/webhook_handlers.py` immediately **after** the database transaction commits — order is already `paid` before the emails go out.

### Cron — management commands run weekly

| Notification | Recipient | Trigger |
|---|---|---|
| Admin unfulfilled order reminder | `ADMIN_EMAIL` | `python manage.py send_admin_reminders` |

---

## Model

**`Message`** (`notifications/models/message.py`)

A record is created for every send attempt, whether it succeeds or fails. Uses a `GenericForeignKey` so it can be linked to any model (Order, service booking, etc.) without schema changes.

| Field | Type | Notes |
|---|---|---|
| `content_type` | FK → ContentType | Part of GenericForeignKey |
| `object_id` | PositiveIntegerField | Part of GenericForeignKey |
| `content_object` | GenericForeignKey | The related Order, booking, etc. |
| `message_type` | CharField | `customer_confirmation`, `admin_new_order`, `admin_reminder`, `test_email` |
| `channel` | CharField | `email` (default), `sms` |
| `to` | CharField | Recipient address |
| `subject` | CharField | Email subject |
| `body_text` | TextField | Plain text body |
| `body_html` | TextField | HTML body |
| `sent_at` | DateTimeField | Populated on success, null on failure |
| `status` | CharField | `sent`, `failed`, `delivered`, `bounced` |
| `error_message` | TextField | Populated on failure |

To query all messages for a specific object:
```python
from django.contrib.contenttypes.models import ContentType
from notifications.models import Message

ct = ContentType.objects.get_for_model(order)
Message.objects.filter(content_type=ct, object_id=order.pk)
```

---

## Email Utilities

All functions live in `notifications/utils/email.py`. They share the same contract:

- Never raise — exceptions from Mailgun are caught, logged, and recorded as a `failed` Message
- If `ADMIN_EMAIL` is not set, admin-targeted functions log a warning and return without sending
- Each successful send creates a `Message` record with `status='sent'` and `sent_at` populated
- Each failed send creates a `Message` record with `status='failed'`
- `_record()` is itself wrapped in a try/except — a DB failure writing the audit record won't surface to the caller

### `send_customer_confirmation(order)`

Sends an order confirmation to `order.customer_email`. Called by the webhook handler.

Branches on `order.payment_type`:
- **`deposit`**: Subject "Deposit confirmed — {ref}". Body confirms the motorcycle is reserved and says the team will be in touch to organise pickup.
- **`full`**: Subject "Order confirmed — {ref}". Body confirms the product purchase with price, delivery address, and contact details.

Context passed to template: the full `order` object.

### `send_admin_new_order(order)`

Sends a new order alert to `ADMIN_EMAIL`. Called by the webhook handler immediately after `send_customer_confirmation`.

Branches on `order.payment_type`:
- **`deposit`**: Subject "New deposit — {ref}". Shows motorcycle name + deposit amount. Customer phone is shown first (as a `tel:` link) since admin needs to call the customer to organise pickup.
- **`full`**: Subject "New ScooterShop order — {ref}". Shows product, price, customer details, and delivery address.

### `send_admin_reminder(order)`

Sends an unfulfilled order reminder to `ADMIN_EMAIL`. Called by the `send_admin_reminders` management command.

---

## Email Templates

All templates live in `notifications/templates/notifications/emails/` and are found via Django's `APP_DIRS=True` loader.

| File | Used by |
|---|---|
| `base.html` | Parent layout — ScooterShop wordmark, content block, footer |
| `customer_confirmation.html` | `send_customer_confirmation` |
| `admin_new_order.html` | `send_admin_new_order` |
| `admin_reminder.html` | `send_admin_reminder` |

To change email copy, edit the relevant template. To change the shared layout (footer, padding, font), edit `base.html`.

---

## Management Commands

### `send_admin_reminders`

**Location**: `notifications/management/commands/send_admin_reminders.py`

```bash
python manage.py send_admin_reminders
```

Sends a weekly summary email to `ADMIN_EMAIL` listing all `paid` orders. Runs only on Mondays by default; use `--force` to run on any day. Uses the `admin_weekly_summary.html` template rather than per-order emails.

### `cleanup_abandoned_orders`

**Location**: `payments/management/commands/cleanup_abandoned_orders.py`

```bash
python manage.py cleanup_abandoned_orders
```

Finds all orders with `status='pending_payment'` and `created_at` more than 7 days ago, and bulk-updates their status to `cancelled`. Intended to run weekly. Prints a count of orders cancelled on completion.

---

## Adding a New Notification

1. Add a `message_type` choice to `Message.MESSAGE_TYPE_CHOICES` in `notifications/models/message.py` (and create a migration)
2. Create an HTML template in `notifications/templates/notifications/emails/` extending `notifications/emails/base.html`
3. Add a sending function in `notifications/utils/email.py` following the existing pattern
4. Call the function from wherever the event occurs (webhook handler, management command, view, etc.)

For SMS (when Twilio is added), follow the same pattern but pass `channel='sms'` to `_record()` and call Twilio instead of Mailgun.

---

## Design Decisions

- **Standalone app, not in `payments`** — `notifications` has zero knowledge of other apps. `payments` imports from `notifications`, not the other way around. This lets the same infrastructure serve service bookings, stock alerts, or anything else without cross-app tangles.
- **`GenericForeignKey` on `Message`** — links the record to any model (Order today, service booking tomorrow) without schema changes or nullable FK columns per model.
- **`channel` field** — `email` now, `sms` when Twilio is added. The model and audit log are already ready for it.
- **No `pending` status** — records are only created at the moment of sending, so they're always either `sent` or `failed`. A `pending` state would imply a queue that doesn't exist.
- **Emails sent outside the DB transaction** — called after `transaction.atomic()` exits in the webhook handler. Avoids holding a DB lock while waiting on Mailgun's API.
- **Management commands split between apps** — `send_admin_reminders` lives in `notifications/` (it builds and sends an email); `cleanup_abandoned_orders` lives in `payments/` (it only mutates Order data and sends nothing).
