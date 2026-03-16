# Motorcycle Deposit

End-to-end flow for reserving a new motorcycle with a deposit payment — from browsing to confirmation — and the corresponding admin workflow.

---

## Overview

Customers can reserve a new motorcycle by paying a flat deposit. The deposit amount is configurable by admin at runtime. On successful payment, the motorcycle is automatically marked as reserved and the admin is notified to contact the customer and organise pickup.

This uses the same checkout pages as product orders (`CheckoutPage`, `CheckoutPaymentPage`, `CheckoutSuccessPage`). The `checkoutType: 'deposit'` flag passed in router state switches the UI and backend logic into deposit mode.

---

## User Flow

```
/inventory/motorcycles/new  (BikeListPage)
  └─ Bike cards
       └─ Click card → /inventory/motorcycles/new/:slug
            │
            ▼
       /inventory/motorcycles/new/:slug  (BikeDetailPage)
            ├─ Bike images, specs, description
            ├─ "Reserve — $X Deposit" button  (shown when status == 'for_sale')
            ├─ "Reserved" message + contact link  (shown when status == 'reserved')
            └─ "Sold" message + contact link     (shown when status == 'sold')
                 │
                 │  "Reserve" button navigates to /checkout/:slug
                 │  with router state: { checkoutType: 'deposit' }
                 │
                 ▼
            /checkout/:slug  (CheckoutPage — deposit mode)
                 ├─ Bike summary card (name, deposit amount)
                 ├─ Customer details form
                 │    ├─ Full Name *
                 │    ├─ Email *
                 │    ├─ Phone *  (required for deposits — admin needs to call customer)
                 │    └─ "Continue to Payment" button
                 │    (no address fields — pickup is arranged separately)
                 │
                 │  On submit:
                 │    POST /api/payments/orders/
                 │      ├─ Validates motorcycle.status == 'for_sale' — 409 if reserved/sold
                 │      ├─ Forces payment_type = 'deposit' server-side
                 │      └─ Creates Order (status: pending_payment)
                 │         Returns: order_id, order_reference
                 │
                 │    POST /api/payments/create-payment-intent/
                 │      ├─ Re-checks motorcycle.status == 'for_sale' — 409 if now unavailable
                 │      └─ Amount = DepositSettings.get().deposit_amount
                 │         Returns: clientSecret
                 │
                 │  Navigate → /checkout/:slug/payment
                 │
                 ▼
            /checkout/:slug/payment  (CheckoutPaymentPage — same as product flow)
                 └─ [Stripe payment form — see product_ordering.md for detail]
                      │
                      ▼
                 /checkout/success?ref=SS-XXXXXXXX  (CheckoutSuccessPage — deposit mode)
                      ├─ "Deposit Confirmed" heading
                      ├─ Deposit reference (monospace)
                      ├─ Motorcycle name + deposit amount paid
                      ├─ "Our team will be in touch as soon as possible to organise pickup"
                      └─ ← Back to New Motorcycles

  [Async — after browser is done]
       │
       ▼
  Stripe webhook → POST /api/payments/webhook/
       ├─ Payment.status = succeeded
       └─ Order.status = paid
```

---

## Emails

### Customer confirmation

- Subject: `Deposit confirmed — {order_reference}`
- Shows motorcycle name, deposit amount, order reference
- "Our team will be in touch as soon as possible to organise pickup."
- No delivery address (pickup only)

### Admin new order alert

- Subject: `New deposit — {order_reference}`
- Shows motorcycle name, deposit amount, date/time
- Customer phone shown first (as a clickable `tel:` link) — admin needs to call to arrange pickup
- Customer email below phone
- "Contact the customer to organise pickup."

---

## Admin Flow

```
/dashboard/inventory  (InventoryManagementPage)
  ├─ Deposit Settings panel (top of page)
  │    ├─ Current deposit amount ($ input)
  │    ├─ "Save" button (disabled until value changes)
  │    └─ PATCH /api/payments/admin/deposit-settings/
  │
  └─ Inventory table (bikes list)

/dashboard/orders  (AdminOrderDashboardPage)
  └─ Deposit orders appear in the same table as product orders
       ├─ Reference cell shows "Deposit" sub-label
       └─ Click row → /dashboard/orders/:id
            │
            ▼
       /dashboard/orders/:id  (AdminOrderDetailPage — deposit mode)
            ├─ Motorcycle name + "Deposit" badge
            ├─ Deposit amount paid
            ├─ Customer name, email, phone
            └─ Status dropdown: pending_payment → paid → completed / cancelled / refunded
               (no delivery address section)
```

After contacting the customer and completing the pickup, admin sets the order status to `completed`.

---

## Motorcycle Availability

| `status` value | Meaning | Reserve button |
|---|---|---|
| `for_sale` | Available to reserve | Shown — "Reserve — $X Deposit" |
| `reserved` | Deposit paid, pickup pending | Hidden — "Reserved" message + contact link |
| `sold` | Sale finalised | Hidden — "Sold" message + contact link |

Status is managed manually by admin (Django admin or inventory table). The webhook does **not** change motorcycle status — marking a bike as reserved is an explicit admin action after contacting the customer.

---

## Deposit Settings

The deposit amount is stored in `DepositSettings` — a singleton model (`payments/models/deposit_settings.py`). Default is $550.00.

- **Frontend read** (public): `GET /api/payments/deposit-settings/`
  Used by `BikeDetailPage` to show the deposit amount on the Reserve button, and by `CheckoutPage` to validate the amount before creating the order.

- **Admin write**: `PATCH /api/payments/admin/deposit-settings/`
  Used by the `DepositSettingsPanel` on the Inventory Management page.

---

## Key Files

| Layer | File |
|---|---|
| Bike detail page | `frontend/src/pages/BikeDetailPage.tsx` |
| Checkout page | `frontend/src/pages/CheckoutPage.tsx` |
| Checkout payment page | `frontend/src/pages/CheckoutPaymentPage.tsx` |
| Checkout success page | `frontend/src/pages/CheckoutSuccessPage.tsx` |
| Inventory management page | `frontend/src/pages/admin/InventoryManagementPage.tsx` |
| Admin order detail page | `frontend/src/pages/admin/AdminOrderDetailPage.tsx` |
| API helpers | `frontend/src/api.ts` (`getDepositSettings`, `adminUpdateDepositSettings`) |
| Order type | `frontend/src/types/Order.ts` |
| DepositSettings model | `payments/models/deposit_settings.py` |
| Order model | `payments/models/order.py` |
| Order serializer | `payments/serializers/order_serializer.py` |
| Deposit settings serializer | `payments/serializers/deposit_settings_serializer.py` |
| Order views | `payments/views/order_views.py` |
| Deposit settings views | `payments/views/deposit_settings_views.py` |
| Payment intent view | `payments/views/create_payment_intent_view.py` |
| Webhook handler | `payments/utils/webhook_handlers.py` |
| Email utils | `notifications/utils/email.py` |
| Customer confirmation email | `notifications/templates/notifications/emails/customer_confirmation.html` |
| Admin new order email | `notifications/templates/notifications/emails/admin_new_order.html` |

---

## Design Decisions

- **Shared checkout pages** — deposit and product orders use the same `CheckoutPage` / `CheckoutPaymentPage` / `CheckoutSuccessPage`. A `checkoutType: 'deposit' | 'product'` flag in router state switches the form fields, copy, and API calls. This avoids duplicating the entire checkout flow.
- **No address fields for deposits** — the customer brings the bike home via a pickup arranged by phone, so delivery address is not collected or stored.
- **Phone required for deposits** — admin needs to call the customer. Enforced server-side in the serializer and client-side in the form.
- **`payment_type` forced server-side** — if a motorcycle is in the order payload, the backend ignores the client's `payment_type` and sets it to `'deposit'`. Prevents crafted requests from making a deposit-priced payment for a product.
- **Deposit amount in the database** — not in `siteSettings.ts`. Admin can change it at runtime without a frontend deployment.
- **Availability checked twice** — `POST orders/` checks `status == 'for_sale'`; `POST create-payment-intent/` checks again before Stripe is called. This mirrors the stock double-gate on product orders.
