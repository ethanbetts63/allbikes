# Notifications

Email notification system for the e-scooter checkout flow. Built into the `payments` Django app. Uses the Mailgun API directly via `requests` — no additional email library needed.

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

Both are called in `payments/utils/webhook_handlers.py` immediately **after** the database transaction commits — order is already `paid` and stock is already decremented before the emails go out.

### Cron — management commands run daily

| Notification | Recipient | Trigger |
|---|---|---|
| Admin unfulfilled order reminder | `ADMIN_EMAIL` | `python manage.py send_admin_reminders` |

---

## Model

**`Notification`** (`payments/models/notification.py`)

A record is created for every send attempt, whether it succeeds or fails. Useful for auditing and debugging.

| Field | Type | Notes |
|---|---|---|
| `order` | FK → Order | `on_delete=CASCADE` |
| `notification_type` | CharField | `customer_confirmation`, `admin_new_order`, `admin_reminder` |
| `sent_at` | DateTimeField | Populated on success, null on failure |
| `status` | CharField | `pending` (default), `sent`, `failed` |

---

## Email Utilities

All three functions live in `payments/utils/email.py`. They share the same contract:

- Never raise — exceptions from Mailgun are caught, logged, and recorded as a `failed` Notification
- If `ADMIN_EMAIL` is not set, admin-targeted functions log a warning and return without sending
- Each successful send creates a `Notification` record with `status='sent'` and `sent_at` populated
- Each failed send creates a `Notification` record with `status='failed'`

### `send_customer_confirmation(order)`

Sends an order confirmation to `order.customer_email`. Called by the webhook handler.

Context passed to template: the full `order` object (with `order.product` available via `select_related`).

### `send_admin_new_order(order)`

Sends a new order alert to `ADMIN_EMAIL`. Called by the webhook handler immediately after `send_customer_confirmation`.

### `send_admin_reminder(order)`

Sends an unfulfilled order reminder to `ADMIN_EMAIL`. Called by the `send_admin_reminders` management command for every `paid` order that hasn't been dispatched.

---

## Email Templates

All templates live in `payments/templates/notifications/emails/` and are found via Django's `APP_DIRS=True` loader.

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

```bash
python manage.py send_admin_reminders
```

Finds all orders with `status='paid'` and calls `send_admin_reminder` for each. Intended to run daily via system cron or PythonAnywhere's scheduled tasks. Prints a count of orders processed on completion.

Reminders fire for every `paid` order on every run — the intent is to nag the admin daily until the order is marked `dispatched`.

### `cleanup_abandoned_orders`

```bash
python manage.py cleanup_abandoned_orders
```

Finds all orders with `status='pending_payment'` and `created_at` more than 24 hours ago, and bulk-updates their status to `cancelled`. Intended to run daily. Prints a count of orders cancelled on completion.

---

## Design Decisions

- **Email only, no SMS** — unlike FutureFlower (which this was modelled on), ScooterShop has no Twilio integration.
- **Emails sent outside the DB transaction** — `send_customer_confirmation` and `send_admin_new_order` are called after `transaction.atomic()` exits in the webhook handler. This avoids holding a DB lock while waiting on Mailgun's API.
- **Notification records on both success and failure** — makes it easy to spot delivery failures in the Django admin without needing to dig through logs.
- **Reminders send every day per paid order** — there is no "already reminded today" deduplication. The daily cron is the deduplication mechanism — if it runs once per day, reminders go out once per day.
- **`select_related('product')` in `send_admin_reminders`** — the management command fetches orders with `select_related('product')` to avoid N+1 queries when building email bodies.
