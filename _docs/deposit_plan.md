# Motorcycle Deposit Plan

End-to-end plan for adding deposit payments on new motorcycles, reusing the existing product checkout infrastructure where possible.

---

## Overview

Customers can place a refundable deposit on a new motorcycle to reserve it. The deposit amount is a flat site-wide figure configurable by an admin. The same checkout flow (pages, Stripe integration, webhook) is used for both product orders and motorcycle deposits — the Order model is extended to support both.

---

## Status Lifecycle

Simplified for both products and motorcycle deposits:

```
pending_payment
      │
      │  (webhook: payment_intent.succeeded)
      ▼
    paid           ← admin sees this in "To Do"
      │
      │  (admin updates manually)
      ▼
  completed
      │
      ├─ cancelled  (can be set from any status by admin)
      └─ refunded   (can be set from any status by admin)
```

`dispatched` and `delivered` are removed. `completed` covers both "product delivered" and "bike collected / sale finalised".

---

## Deposit Amount

- Flat site-wide amount, default **$550 AUD**.
- Stored in a `DepositSettings` singleton model in the `payments` app.
- Readable via a public GET endpoint. Writable via an admin-authenticated PATCH endpoint.
- Admin dashboard gets a settings panel to adjust the amount.
- The `siteSettings.ts` frontend config file is **not** used for this — backend is the source of truth.

---

## Backend Changes

### 1. New model: `DepositSettings` (`payments/models/deposit_settings.py`)

Singleton model (only one row, enforced in `save()`).

| Field | Type | Notes |
|---|---|---|
| `deposit_amount` | DecimalField | AUD, default 550.00 |
| `updated_at` | DateTimeField | auto |

### 2. Modified model: `Order` (`payments/models/order.py`)

| Change | Detail |
|---|---|
| `product` FK | Make **nullable** (`null=True, blank=True`) |
| Add `motorcycle` FK | `FK → inventory.Motorcycle`, `null=True, blank=True`, `on_delete=PROTECT` |
| Add `payment_type` | CharField — `full` or `deposit`, default `full` |
| Status choices | Replace `dispatched`/`delivered` with `completed` |

Constraint: exactly one of `product` / `motorcycle` is set. Enforced via model `clean()`.

### 3. Modified view: `CreatePaymentIntentView`

- Accept `motorcycle_id` as an alternative to `order_id` being product-linked.
- For deposit orders: charge `DepositSettings.deposit_amount` instead of product price.
- Stock gate for motorcycles: `motorcycle.status == 'for_sale'` (instead of `stock_quantity > 0`).
- Idempotency logic unchanged — still checks existing `pending` Payment for the order.

### 4. Modified view: `OrderCreateView`

- Accept either `product_id` or `motorcycle_id` in the request body.
- Set `payment_type = 'deposit'` automatically when `motorcycle_id` is provided (for now — full payment on used bikes can be added later by passing `payment_type` explicitly).
- Validate that the motorcycle is `status == 'for_sale'` before creating the order (stock gate 1).

### 5. Modified webhook handler: `handle_payment_intent_succeeded`

Branch on `order.payment_type`:
- `full` (product): existing behaviour — decrement `stock_quantity`, mark order `paid`.
- `deposit` (motorcycle): mark motorcycle `status = 'reserved'`, mark order `paid`.

### 6. New endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `deposit-settings/` | AllowAny | Return current deposit amount |
| PATCH | `admin/deposit-settings/` | IsAdminUser | Update deposit amount |

### 7. Migration notes

- `Order.product` going nullable is safe — existing rows keep their value, only new motorcycle orders will have `product = null`.
- New `DepositSettings` migration inserts the default row (`deposit_amount = 550.00`).

---

## Frontend Changes

### New / modified pages

| Page | Route | Change |
|---|---|---|
| `BikeDetailPage` | `/inventory/motorcycles/:slug` | Add "Reserve with Deposit" button for `status == 'for_sale'` bikes with `condition == 'new'`. Shows deposit amount fetched from backend. |
| `CheckoutPage` | `/checkout/:slug` | Make generic — detect from router state whether this is a product or motorcycle, adjust labels and summary card accordingly. |
| `CheckoutPaymentPage` | `/checkout/:slug/payment` | Same — already works off `clientSecret`, no product-specific logic. Minor label changes. |
| `CheckoutSuccessPage` | `/checkout/success` | Show appropriate summary (product order vs deposit confirmation). |

### Router state

The existing pattern passes `clientSecret` and `orderReference` through router state. Extend to also pass `checkoutType: 'product' | 'deposit'` and the relevant item details (product or motorcycle) so pages can render correctly without an extra fetch.

### Deposit amount

Fetched once on `BikeDetailPage` mount from `GET /api/payments/deposit-settings/`. Displayed in the button and checkout summary. Passed through router state so payment page doesn't need to re-fetch.

### Admin dashboard

New settings panel (e.g. in `ServiceSettingsPage` pattern or a new `AdminDepositSettingsPage`) with a simple form: current deposit amount + input to update it via `PATCH /api/payments/admin/deposit-settings/`.

---

## Email Notifications

`send_customer_confirmation` and `send_admin_new_order` currently assume a product order. Both need to branch on `order.payment_type`:

- `full`: existing copy ("Your order is confirmed").
- `deposit`: new copy ("Your deposit has been received — your bike is now reserved. Our team will be in touch.").

Motorcycle name/details replace product name/details in the email body.

---

## What Is Not Changing

- Stripe integration (PaymentIntent, webhook signature verification) — untouched.
- `Payment` model — untouched.
- The 3DS redirect / processing flow — untouched.
- E-scooter checkout — untouched, existing path still works exactly as before.
- The admin order list and detail pages — extended to handle motorcycle orders, not replaced.

---

## Build Order

1. **Backend — models & migration**: `DepositSettings`, modify `Order` (nullable product, add motorcycle FK, payment_type, status choices).
2. **Backend — views & URLs**: order create, payment intent, webhook handler, deposit-settings endpoints.
3. **Backend — emails**: update notification utils.
4. **Frontend — API layer**: add fetch for deposit settings, motorcycle order creation.
5. **Frontend — BikeDetailPage**: "Reserve with Deposit" button.
6. **Frontend — Checkout flow**: make generic for product/deposit.
7. **Frontend — Admin**: deposit settings panel.
8. **Docs**: update `payments.md` and `product_ordering.md`.
