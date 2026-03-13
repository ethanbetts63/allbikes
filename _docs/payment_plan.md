# Phase 4 — Stripe Payment Integration

Modelled closely on the FutureFlower implementation. Key difference: public checkout (no user accounts), so no Stripe Customer object and `AllowAny` on all endpoints.

---

## Setup

### Backend
- `pip install stripe` — add to `requirements.txt`
- New env vars in `.env`: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- Read both in `settings.py`

### Frontend
- `npm install @stripe/stripe-js @stripe/react-stripe-js`
- New env var in `frontend/.env`: `VITE_STRIPE_PUBLISHABLE_KEY`

---

## Backend

### 1. Payment model (`shop/models/payment.py`)
- `order` — OneToOneField to Order
- `stripe_payment_intent_id` — unique CharField
- `amount` — DecimalField (10, 2)
- `status` — choices: `pending`, `succeeded`, `failed` (default `pending`)
- `created_at`, `updated_at`

### 2. Modify `POST /api/shop/orders/`
- Order is created as `pending_payment` (was `paid` in Phase 3)
- Stock is NOT decremented here (moves to webhook)
- Stock check (> 0, 409 if not) stays as first gate

### 3. New `POST /api/shop/create-payment-intent/` — `AllowAny`
- Input: `{ order_id }`
- Validate: order exists, status is `pending_payment`
- Re-check stock > 0 (second gate — 409 if gone)
- Staff/superuser override: amount = $1.00
- $0.50 floor (Stripe minimum)
- Idempotency: if a `pending` Payment already exists for this order with the same amount, return the existing `clientSecret`. If amount differs, cancel old PaymentIntent and create new.
- Creates Stripe `PaymentIntent` — no Customer object (public checkout)
- Creates local `Payment` record (status `pending`)
- Returns `{ clientSecret }`

### 4. New `POST /api/shop/webhook/` — `AllowAny`, signature verified

**`payment_intent.succeeded`:**
- Verify Stripe signature — 400 if invalid
- Idempotency: if Payment already `succeeded`, return 200 and stop
- Mark `Payment.status = succeeded`
- Mark `Order.status = paid`
- Atomic stock decrement: `Product.objects.filter(pk=..., stock_quantity__gt=0).update(stock_quantity=F('stock_quantity') - 1)` — if returns 0 rows (sold out between intent and webhook), log for admin but do not fail webhook
- Phase 5 hook: email sending goes here

**`payment_intent.payment_failed`:**
- Mark `Payment.status = failed`
- Order stays `pending_payment` (user can retry)

### 5. Migration for Payment model

---

## Frontend

### 1. Modify `CheckoutPage` (`/checkout/:productSlug`)
Submit handler changes:
- `POST /api/shop/orders/` → get `order_id` + `order_reference` (order is `pending_payment`)
- `POST /api/shop/create-payment-intent/` with `order_id` → get `clientSecret`
- Navigate to `/checkout/:productSlug/payment` with `{ clientSecret, orderReference }` in router state

### 2. New `CheckoutPaymentPage` (`/checkout/:productSlug/payment`)
- Read `clientSecret` + `orderReference` from router state — if missing, redirect to details page
- Load product for summary card (same as details page)
- `loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)`
- Wrap form in `<Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>`
- Inside: `<PaymentElement />` + amber "Pay Now" button + loading state
- On submit: `stripe.confirmPayment()` with:
  - `redirect: "if_required"`
  - `return_url: ${origin}/checkout/processing?ref=${orderReference}&slug=${productSlug}`
- No-redirect case (most cards): if `paymentIntent.status === 'succeeded'` returned directly → navigate to `/checkout/success?ref=${orderReference}`
- Failed case: `requires_payment_method` → show inline error, user re-enters card
- Redirect case (3DS): Stripe handles automatically

### 3. New `CheckoutProcessingPage` (`/checkout/processing`)
Mirrors FutureFlower's `PaymentStatusPage`.
- Read `payment_intent_client_secret`, `ref`, and `slug` from URL query params
- Call `stripe.retrievePaymentIntent(payment_intent_client_secret)`
- `succeeded` → navigate to `/checkout/success?ref=${ref}`
- `processing` → show spinner, poll every 2s up to ~30s, then navigate anyway
- `requires_payment_method` (failed) → navigate to `/checkout/${slug}/payment` with error in router state

### 4. Route changes (`App.tsx`)
- `/checkout/success` moved **before** `/checkout/:productSlug` (static beats dynamic)
- Add `/checkout/:productSlug/payment` → `CheckoutPaymentPage`
- Add `/checkout/processing` → `CheckoutProcessingPage`

---

## Happy Path Flow

```
1. /checkout/:slug           fill details → POST orders/ → POST create-payment-intent/
2. /checkout/:slug/payment   enter card → stripe.confirmPayment()
3. Stripe (3DS if needed)    redirects to /checkout/processing?ref=SS-xxx&slug=xxx
4. /checkout/processing      stripe.retrievePaymentIntent() → succeeded → redirect
5. /checkout/success         existing confirmation page
6. Stripe webhook (async)    payment_intent.succeeded → marks order paid, decrements stock
```

---

## Differences From FutureFlower

| | FutureFlower | Allbikes |
|---|---|---|
| Auth on create-payment-intent | `IsAuthenticated` | `AllowAny` |
| Stripe Customer object | Yes (lazy, stored on user) | No |
| Idempotency check | By amount + pending status | Same |
| Staff override ($1.00) | Yes | Yes |
| Post-payment polling | Yes (waits for plan to activate) | No |
| Webhook events handled | 8 | 2 (`succeeded`, `failed`) |
