# Product Ordering

End-to-end flow for purchasing an e-scooter — from browsing to confirmation — and the corresponding admin workflow.

---

## User Flow

```
/escooters  (EScooterListPage)
  └─ ProductCard grid
       ├─ Shows name, brand, price (strikethrough + amber if discounted)
       ├─ "Out of Stock" badge if stock_quantity = 0
       └─ Clicking card → /escooters/:slug
            │
            ▼
       /escooters/:slug  (EScooterDetailPage)
            ├─ Image gallery, full description, specs
            ├─ Price display (amber discount / regular)
            ├─ "Buy Now" button → /checkout/:slug
            └─ Button disabled + "Out of Stock" if stock_quantity = 0
                 │
                 ▼
            /checkout/:slug  (CheckoutPage)
                 ├─ Product summary card (image, name, price)
                 ├─ Customer details form
                 │    ├─ Full Name *
                 │    ├─ Email *
                 │    ├─ Phone (optional)
                 │    ├─ Address Line 1 *
                 │    ├─ Address Line 2 (optional)
                 │    ├─ Suburb *, State * (AU dropdown), Postcode *
                 │    └─ "Continue to Payment" button
                 │
                 │  On submit:
                 │    POST /api/payments/orders/
                 │      └─ Stock gate 1: 409 if out of stock → show error, stop
                 │      └─ Creates Order (status: pending_payment)
                 │         Returns: order_id, order_reference
                 │
                 │    POST /api/payments/create-payment-intent/
                 │      └─ Stock gate 2: 409 if sold out → show error, stop
                 │      └─ Creates Stripe PaymentIntent + local Payment record
                 │         Returns: clientSecret
                 │
                 │  Navigate → /checkout/:slug/payment
                 │    (clientSecret + orderReference passed via router state)
                 │
                 ▼
            /checkout/:slug/payment  (CheckoutPaymentPage)
                 ├─ Product summary card (same as above)
                 ├─ Order reference displayed
                 ├─ Stripe <Elements> wrapper (clientSecret + stripe theme)
                 │    └─ <PaymentElement>  (card / Apple Pay / Google Pay etc.)
                 └─ "Pay Now" button
                      │
                      │  On submit: stripe.confirmPayment({ redirect: "if_required" })
                      │
                      ├─ [No redirect — most cards]
                      │    ├─ status: succeeded  → navigate to /checkout/success?ref=...
                      │    └─ status: requires_payment_method → show inline error, user retries
                      │
                      └─ [Redirect — 3DS cards]
                           Stripe redirects to /checkout/processing?payment_intent_client_secret=...&ref=...&slug=...
                                │
                                ▼
                           /checkout/processing  (CheckoutProcessingPage)
                                ├─ Spinner shown while polling
                                ├─ stripe.retrievePaymentIntent(clientSecret)
                                │    ├─ succeeded        → /checkout/success?ref=...
                                │    ├─ processing       → poll every 2s, up to 30s, then redirect anyway
                                │    └─ requires_payment_method → /checkout/:slug/payment (with error in state)
                                │
                                ▼
                           /checkout/success?ref=SS-XXXXXXXX  (CheckoutSuccessPage)
                                ├─ Green check mark
                                ├─ Order reference (monospace)
                                └─ Order summary: product, address, contact

  [Async — after browser is done]
       │
       ▼
  Stripe webhook → POST /api/payments/webhook/
       ├─ Signature verified
       ├─ payment_intent.succeeded
       │    ├─ Idempotency check (skip if already succeeded)
       │    ├─ Payment.status = succeeded
       │    ├─ Order.status = paid
       │    └─ stock_quantity decremented atomically (F() expression)
       │
       └─ payment_intent.payment_failed
            ├─ Payment.status = failed
            └─ Order stays pending_payment (user can retry)
```

---

## Admin Flow

```
/dashboard/orders  (AdminOrderDashboardPage → OrderTable)
  ├─ "To Do" filter  → shows orders with status: paid
  ├─ "All Orders" filter → shows all statuses
  ├─ Sortable columns: Item, Customer, Date
  ├─ Status badges (colour-coded)
  ├─ Deposit orders show a "Deposit" sub-label on the reference cell
  └─ Click row → /dashboard/orders/:id
       │
       ▼
  /dashboard/orders/:id  (AdminOrderDetailPage)
       ├─ Header
       │    ├─ Order reference (monospace) + status badge  [left]
       │    └─ Status dropdown + "Update Status" button    [right]
       │
       ├─ Order Details
       │    ├─ Product name  (or motorcycle name + "Deposit" badge for deposit orders)
       │    ├─ Price / Deposit amount
       │    ├─ Date placed
       │    └─ Last updated
       │
       ├─ Customer
       │    ├─ Name
       │    ├─ Email
       │    └─ Phone (if provided)
       │
       ├─ Delivery Address  (product orders only — not shown for deposits)
       │    └─ Full address on one line
       │
       └─ ← Back to Orders  [bottom left]
```

### Status Lifecycle

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

Applies to both product orders and motorcycle deposit orders. For deposits, `completed` means the pickup has been organised and the sale is finalised.

---

## Key Pages & Files

| Page | Route | File |
|---|---|---|
| Scooter list | `/escooters` | `src/pages/EScooterListPage.tsx` |
| Scooter detail | `/escooters/:slug` | `src/pages/EScooterDetailPage.tsx` |
| Checkout — details | `/checkout/:slug` | `src/pages/CheckoutPage.tsx` |
| Checkout — payment | `/checkout/:slug/payment` | `src/pages/CheckoutPaymentPage.tsx` |
| Checkout — processing | `/checkout/processing` | `src/pages/CheckoutProcessingPage.tsx` |
| Checkout — success | `/checkout/success` | `src/pages/CheckoutSuccessPage.tsx` |
| Admin — order list | `/dashboard/orders` | `src/pages/admin/AdminOrderDashboardPage.tsx` |
| Admin — order detail | `/dashboard/orders/:id` | `src/pages/admin/AdminOrderDetailPage.tsx` |

| Backend | File |
|---|---|
| Order + Payment models | `payments/models/` |
| Order create / retrieve | `payments/views/order_views.py` |
| Create payment intent | `payments/views/create_payment_intent_view.py` |
| Webhook receiver | `payments/views/webhook_view.py` |
| Webhook handlers | `payments/utils/webhook_handlers.py` |
| Admin order views | `payments/views/admin_order_views.py` |
| URL config | `payments/urls.py` |
