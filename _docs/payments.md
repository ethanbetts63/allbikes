# Payments

Stripe-based payment integration for public (no-account) checkout. Built around the `payments` Django app.

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
| `product` | FK → `product.Product` | `on_delete=PROTECT` |
| `order_reference` | CharField | Auto-generated `SS-XXXXXXXX` (8 hex chars) on first save |
| `customer_name` | CharField | |
| `customer_email` | EmailField | |
| `customer_phone` | CharField | Optional |
| `address_line1/2` | CharField | line2 optional |
| `suburb`, `state`, `postcode` | CharField | |
| `status` | CharField | `pending_payment` → `paid` → `dispatched` → `delivered` / `cancelled` / `refunded` |
| `created_at`, `updated_at` | DateTimeField | auto |

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

### API Endpoints

All under `/api/payments/`. Permission is `AllowAny` except admin routes.

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `orders/` | AllowAny | Create order (returns `order_id` + `order_reference`) |
| GET | `orders/<order_reference>/` | AllowAny | Retrieve order by reference |
| POST | `create-payment-intent/` | AllowAny | Create Stripe PaymentIntent, returns `clientSecret` |
| POST | `webhook/` | AllowAny (sig verified) | Stripe webhook receiver |
| GET | `admin/orders/` | IsAdminUser | List orders (optional `?status=` filter) |
| GET | `admin/orders/<pk>/` | IsAdminUser | Retrieve order |
| PATCH | `admin/orders/<pk>/status/` | IsAdminUser | Update order status |

### `create-payment-intent` Logic

1. Validate `order_id` — 400 if missing, 404 if not found
2. Confirm order status is `pending_payment` — 400 otherwise
3. Re-check product stock > 0 — 409 if sold out (second gate)
4. Determine amount:
   - Staff / superuser → **$1.00** (testing override)
   - Has `discount_price` → use that
   - Otherwise → use `product.price`
   - Floor: $0.50 (Stripe minimum)
5. Idempotency check — if a `pending` Payment already exists for this order:
   - Same amount → retrieve and return existing `clientSecret`
   - Different amount → cancel old PaymentIntent, delete Payment, create fresh
6. Create Stripe `PaymentIntent` (no Customer object — public checkout)
7. Create local `Payment` record with status `pending`
8. Return `{ clientSecret }`

### Webhook Handler

Signature verified via `stripe.Webhook.construct_event()`. Invalid signature → 400.

**`payment_intent.succeeded`** (`payments/utils/webhook_handlers.py`):
- Idempotent — if Payment already `succeeded`, returns immediately
- Wrapped in `transaction.atomic()`
- Marks `Payment.status = succeeded`
- Marks `Order.status = paid`
- Atomic stock decrement: `Product.objects.filter(pk=..., stock_quantity__gt=0).update(stock_quantity=F('stock_quantity') - 1)`
- If product already at 0 (sold between intent and webhook) → logs warning, does not fail

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
- **Stock is NOT decremented at order creation** — only decremented inside the `payment_intent.succeeded` webhook handler, atomically. This prevents phantom stock holds on abandoned carts.
- **Stock is checked twice** — once at `POST orders/` (fast rejection of obviously out-of-stock) and again at `POST create-payment-intent/` (second gate before Stripe is called).
- **`redirect: "if_required"`** — `stripe.confirmPayment()` only redirects for 3DS flows. Most cards resolve immediately without leaving the page.
