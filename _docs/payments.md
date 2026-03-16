# Payments

Stripe-based payment integration for public (no-account) checkout. Built around the `payments` Django app. Supports both full product purchases (e-scooters) and flat-fee deposit payments (new motorcycles).

---

## Environment Variables

### Backend (`.env` in project root)

| Variable | Description |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_test_...` / `sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | Signing secret from `stripe listen` or Stripe dashboard (`whsec_...`) |

Both are read in `settings.py`:
```python
STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET")
```

### Frontend (`frontend/.env`)

| Variable | Description |
|---|---|
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (`pk_test_...` / `pk_live_...`) |

---

## Dependencies

### Backend
```
stripe  # in requirements.txt
```
Install: `pip install stripe`

### Frontend
```
@stripe/stripe-js
@stripe/react-stripe-js
```
Install: `npm install @stripe/stripe-js @stripe/react-stripe-js`

---

## Django App: `payments`

Registered in `INSTALLED_APPS` as `"payments"`. All API endpoints live under `/api/payments/`.

### Models

**`Order`** (`payments/models/order.py`)

| Field | Type | Notes |
|---|---|---|
| `product` | FK → `product.Product` | `on_delete=PROTECT`, nullable — set for product orders |
| `motorcycle` | FK → `inventory.Motorcycle` | `on_delete=PROTECT`, nullable — set for deposit orders |
| `payment_type` | CharField | `full` (product purchase) or `deposit` (motorcycle reservation) |
| `order_reference` | CharField | Auto-generated `SS-XXXXXXXX` (8 hex chars) on first save |
| `customer_name` | CharField | |
| `customer_email` | EmailField | |
| `customer_phone` | CharField | Optional for product orders; required for deposit orders |
| `address_line1/2` | CharField | Required for product orders; blank for deposit orders |
| `suburb`, `state`, `postcode` | CharField | Required for product orders; blank for deposit orders |
| `status` | CharField | `pending_payment` → `paid` → `completed` / `cancelled` / `refunded` |
| `created_at`, `updated_at` | DateTimeField | auto |

Exactly one of `product` or `motorcycle` must be set. This is enforced in the serializer and validated in `Order.clean()`.

Order references are generated via `secrets.token_hex(4).upper()` in a collision-safe loop, producing e.g. `SS-3F8A2C1D`.

**`Payment`** (`payments/models/payment.py`)

OneToOne with Order. Created when the frontend calls `create-payment-intent`.

| Field | Type | Notes |
|---|---|---|
| `order` | OneToOneField → Order | `on_delete=CASCADE` |
| `stripe_payment_intent_id` | CharField | Unique |
| `amount` | DecimalField | AUD, what was charged |
| `status` | CharField | `pending` → `succeeded` / `failed` |
| `created_at`, `updated_at` | DateTimeField | auto |

**`DepositSettings`** (`payments/models/deposit_settings.py`)

Singleton model (only one row, `pk=1`) storing the flat deposit amount charged for motorcycle reservations.

| Field | Type | Notes |
|---|---|---|
| `deposit_amount` | DecimalField | AUD, default `550.00` |
| `updated_at` | DateTimeField | auto |

Access via `DepositSettings.get()` — uses `get_or_create(pk=1)` so it's always safe to call even before an admin has saved a value.

### API Endpoints

All under `/api/payments/`. Permission is `AllowAny` except admin routes.

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `orders/` | AllowAny | Create order (returns `order_id` + `order_reference`) |
| GET | `orders/<order_reference>/` | AllowAny | Retrieve order by reference |
| POST | `create-payment-intent/` | AllowAny | Create Stripe PaymentIntent, returns `clientSecret` |
| POST | `webhook/` | AllowAny (sig verified) | Stripe webhook receiver |
| GET | `deposit-settings/` | AllowAny | Get current deposit amount |
| PATCH | `admin/deposit-settings/` | IsAdminUser | Update deposit amount |
| GET | `admin/orders/` | IsAdminUser | List orders (optional `?status=` filter) |
| GET | `admin/orders/<pk>/` | IsAdminUser | Retrieve order |
| PATCH | `admin/orders/<pk>/status/` | IsAdminUser | Update order status |

### `create-payment-intent` Logic

1. Validate `order_id` — 400 if missing, 404 if not found
2. Confirm order status is `pending_payment` — 400 otherwise
3. Branch on `order.payment_type`:
   - **`full` (product)**: Re-check `stock_quantity > 0` — 409 if sold out (second gate). Amount = `discount_price` if set, else `price`.
   - **`deposit`**: Re-check `motorcycle.status == 'for_sale'` — 409 if no longer available (second gate). Amount = `DepositSettings.get().deposit_amount`.
4. Idempotency check — if a `pending` Payment already exists for this order:
   - Same amount → retrieve and return existing `clientSecret`
   - Different amount → cancel old PaymentIntent, delete Payment, create fresh
5. Create Stripe `PaymentIntent` (no Customer object — public checkout)
6. Create local `Payment` record with status `pending`
7. Return `{ clientSecret }`

### Webhook Handler

Signature verified via `stripe.Webhook.construct_event()`. Invalid signature → 400.

**`payment_intent.succeeded`** (`payments/utils/webhook_handlers.py`):
- Idempotent — if Payment already `succeeded`, returns immediately
- Wrapped in `transaction.atomic()`
- Marks `Payment.status = succeeded`
- Marks `Order.status = paid`
- Branch on `order.payment_type`:
  - **`full`**: Atomic stock decrement: `Product.objects.filter(pk=..., stock_quantity__gt=0).update(stock_quantity=F('stock_quantity') - 1)`. If product already at 0 → logs warning, does not fail.
  - **`deposit`**: Atomic status update: `Motorcycle.objects.filter(pk=..., status='for_sale').update(status='reserved')`. If motorcycle already reserved → logs warning, does not fail.

**`payment_intent.payment_failed`**:
- Marks `Payment.status = failed`
- Order stays `pending_payment` (user can retry)

---

## Local Development — Stripe CLI

Forward webhooks to the local server:

```bash
stripe listen --forward-to localhost:8000/api/payments/webhook/
```

Copy the `whsec_...` secret printed by the CLI into your `.env` as `STRIPE_WEBHOOK_SECRET`, then restart the Django server.

---

## Design Decisions

- **No Stripe Customer object** — checkout is fully public, no user accounts.
- **Stock/availability checked twice** — once at `POST orders/` (fast rejection) and again at `POST create-payment-intent/` (second gate before Stripe is called). For motorcycles the check is `status == 'for_sale'`; for products it's `stock_quantity > 0`.
- **`payment_type` forced server-side** — when a motorcycle is in the order payload, the backend sets `payment_type = 'deposit'` regardless of what the client sends. Prevents crafted requests from bypassing the deposit flow.
- **`authentication_classes = []` on public views** — Django REST Framework's default `SessionAuthentication` enforces CSRF when a session cookie is present (e.g. an admin browsing in the same browser). Setting `authentication_classes = []` on all public payment views (`OrderCreateView`, `OrderRetrieveView`, `CreatePaymentIntentView`, `DepositSettingsView`) opts them out of CSRF enforcement without weakening security — these endpoints are stateless and rely on no session-based auth.
- **`redirect: "if_required"`** — `stripe.confirmPayment()` only redirects for 3DS flows. Most cards resolve immediately without leaving the page.
- **Deposit amount in the database** — `DepositSettings` is a backend singleton so the admin can adjust the deposit amount at runtime without a frontend deployment.
