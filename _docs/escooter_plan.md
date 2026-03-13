# E-Scooter Feature — Implementation Plan

## Overview

Two new Django apps:
- **`product`** — Product and ProductImage models. All product CRUD.
- **`shop`** — Order and Payment models. Checkout flow, Stripe integration, notifications.

Notification/email infrastructure built fresh (nothing exists in the codebase currently).
Stripe built fresh (nothing exists in the codebase currently).

---

## Phase 1 — Product App + Admin UI

Goal: Admin can manage products and stock levels through the dashboard. Nothing user-facing yet.

### Backend

**New app: `product/`**

Follow the `inventory` app pattern: `models/`, `views/`, `serializers/`, `tests/` subdirectories.

Models:
- `Product` — `name`, `brand` (CharField, optional), `description` (TextField, optional), `price` (DecimalField 10,2 — always GST-inclusive), `stock_quantity` (IntegerField, default 0), `is_active` (BooleanField, default True), `slug` (SlugField, unique, auto-generated from name+id on save)
- `ProductImage` — FK to Product, `image` (ImageField), `thumbnail` (ImageSpecField, 400x400 WEBP), `medium` (ImageSpecField, 800x600 WEBP), `order` (IntegerField). Mirror MotorcycleImage exactly.

Endpoints (all admin-only, `IsAdminUser`):
- `GET/POST /api/product/products/` — list / create
- `GET/PUT/PATCH/DELETE /api/product/products/{id}/` — retrieve / update / delete
- `POST /api/product/products/{id}/images/` — upload image
- `POST /api/product/products/{id}/manage_images/` — reorder / delete images (mirror inventory pattern)

Register `product` in `INSTALLED_APPS` and `api/product/` in root `urls.py`.

### Frontend (Admin)

New pages under `frontend/src/pages/admin/`:
- `AdminProductDashboardPage.tsx` — table of all products showing name, price, stock_quantity, is_active. Links to detail page. Button to add new product.
- `AdminProductDetailPage.tsx` — used for both add and edit (mirror `AddMotorcyclePage` pattern). Fields: name, brand, description, price, stock_quantity, is_active. Image management section (upload, reorder, delete).

New routes in `App.tsx` (nested under `/dashboard`):
```
/dashboard/products             → AdminProductDashboardPage
/dashboard/products/new         → AdminProductDetailPage (add mode)
/dashboard/products/:id/edit    → AdminProductDetailPage (edit mode)
```

Add "Products" nav link in `AdminLayout.tsx`.

New types in `frontend/src/types/`: `Product.ts`, `ProductImage.ts`.

New API functions in `api.ts`: `getProducts`, `getProduct`, `createProduct`, `updateProduct`, `deleteProduct`, `uploadProductImage`, `manageProductImages`.

---

## Phase 2 — User-Facing Product Pages + Static Pages

Goal: Users can browse e-scooters. Static legal/refund pages exist. Homepage links to e-scooters.

### Backend

New public endpoints (read-only, `AllowAny`):
- `GET /api/product/products/` — add a public read path that filters `is_active=True` and `stock_quantity__gte=0`. Or add a separate public viewset action. Stock status communicated via a computed field: `in_stock` (bool), `low_stock` (bool, threshold TBD — suggest 3).

### Frontend

New public pages:
- `EScooterListPage.tsx` — grid of active products. Each card shows image, name, price (inc. GST), "Free Delivery" badge, in-stock/low-stock/out-of-stock indicator. Links to detail page.
- `EScooterDetailPage.tsx` — full product detail. Image gallery (mirror BikeDetailPage pattern). Price (inc. GST), free delivery, stock status. "Buy Now" button → navigates to checkout Page 1.
- `RefundsPage.tsx` — static page. Links to T&C. Provides refund request email address.
- `TermsAndConditionsPage.tsx` — already exists, may need escooter-specific content added.

Update `HomePage.tsx` — add an e-scooter feature section: headline, 2-3 product images, link to `/escooters`.

New routes in `App.tsx`:
```
/escooters              → EScooterListPage
/escooters/:slug        → EScooterDetailPage
/refunds                → RefundsPage
```

---

## Phase 3 — Order Flow (No Payment)

Goal: Full checkout UI works end to end. Payment step is skipped (order goes straight to `paid` for testing). Admin can view and manage orders.

### Backend

**New app: `shop/`**

Models:
- `Order` — `product` (FK to Product), `order_reference` (CharField, unique, auto-generated on save: `SS-YYYYMMDD-XXXX` where XXXX is zero-padded daily sequence), `customer_name`, `customer_email`, `customer_phone` (optional), `address_line1`, `address_line2` (optional), `suburb`, `state`, `postcode`, `status` (choices: `pending_payment`, `paid`, `dispatched`, `delivered`, `cancelled`, `refunded`, default `pending_payment`), `created_at` (auto_now_add), `updated_at` (auto_now)
- `Payment` — `order` (OneToOneField to Order), `stripe_payment_intent_id` (CharField, unique), `amount` (DecimalField 10,2), `status` (choices: `pending`, `succeeded`, `failed`, default `pending`), `created_at`, `updated_at`

Endpoints:
- `POST /api/shop/orders/` — public (`AllowAny`). Validates customer details + product FK. Checks `stock_quantity > 0` (return 409 if out of stock). Creates Order with status `pending_payment`. Returns order id and order_reference.
- `GET /api/shop/orders/{order_reference}/` — public. Returns order summary for confirmation page.
- `GET /api/shop/admin/orders/` — admin only. Returns all orders, filterable by status.
- `GET /api/shop/admin/orders/{id}/` — admin only. Full order detail.
- `PATCH /api/shop/admin/orders/{id}/status/` — admin only. Updates status field only.

Register `shop` in `INSTALLED_APPS` and `api/shop/` in root `urls.py`.

### Frontend (User — Checkout Flow)

Multi-step checkout state managed in a parent `CheckoutPage.tsx` (or via React Router with state passing). Steps:

- **Step 1 — Customer Details** (`CheckoutDetailsPage.tsx`): Name, email, phone (optional), address fields. Stock re-checked on submit against backend before proceeding. If out of stock → show error, do not proceed.
- **Step 2 — Order Overview / Payment** (`CheckoutPaymentPage.tsx`): Shows order summary (product, price inc. GST, free delivery, customer details). In this phase: a "Confirm Order" button that posts to `/api/shop/orders/` and skips straight to success. Payment UI added in Phase 4.
- **Step 3 — Payment Processing** (`CheckoutProcessingPage.tsx`): Stripe redirect/spinner page. Added in Phase 4, placeholder for now.
- **Step 4 — Success / Failure** (`CheckoutSuccessPage.tsx`): Displays order reference, product, price, customer details. Note that confirmation email will be sent. If payment failed (Phase 4), shows failure message with button back to Step 2.

New routes:
```
/checkout/:productSlug          → CheckoutDetailsPage (Step 1)
/checkout/:productSlug/payment  → CheckoutPaymentPage (Step 2)
/checkout/processing            → CheckoutProcessingPage (Step 3, Phase 4)
/checkout/success               → CheckoutSuccessPage (Step 4)
```

### Frontend (Admin — Orders)

New pages:
- `AdminOrderDashboardPage.tsx` — two tabs: "To Do" (status=`paid` or `dispatched`) and "All Orders". Table with order reference, customer name, product, status, date. Clickable rows.
- `AdminOrderDetailPage.tsx` — full order details. Status badge. Dropdown + button to update status.

New routes:
```
/dashboard/orders               → AdminOrderDashboardPage
/dashboard/orders/:id           → AdminOrderDetailPage
```

Add "Orders" nav link in `AdminLayout.tsx`.

---

## Phase 4 — Stripe Payment Integration

Goal: Real payments flow through Stripe. Stock decrements on successful payment. Staff pay $1.

### Setup

Add to `requirements.txt`: `stripe`
Add to `.env`: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
Add to `settings.py`: read the above env vars.
Add to frontend `.env`: `VITE_STRIPE_PUBLISHABLE_KEY`

### Backend

New endpoints in `shop/`:
- `POST /api/shop/create-payment-intent/` — `IsAuthenticated` OR public (decision: public, since no user accounts). Receives `order_id`. Looks up Order (must be `pending_payment`). Checks stock > 0 again. Staff/superuser override → amount = $1.00. Minimum $0.50 floor. Creates Stripe Customer lazily (stored on... Order email, since no user model — or just don't attach to customer, keep it simple for v1). Creates `PaymentIntent`. Creates local `Payment` record (status=`pending`). Returns `clientSecret`.
- `POST /api/shop/webhook/` — `AllowAny`, verifies Stripe signature. Handles:
  - `payment_intent.succeeded` → marks Payment succeeded, sets Order to `paid`, decrements `Product.stock_quantity` using `F()` expression with `filter(stock_quantity__gt=0)` to prevent going below 0, sends customer confirmation email, sends admin new order email.
  - `payment_intent.payment_failed` → marks Payment failed, Order stays `pending_payment` (user can retry).

Idempotency:
- On `create-payment-intent`: if a `pending` Payment already exists for this Order with matching amount, return existing clientSecret.
- On webhook `payment_intent.succeeded`: if Order already `paid`, return immediately.

### Frontend

Wire up Stripe Elements to `CheckoutPaymentPage.tsx`:
- Load `@stripe/react-stripe-js` and `@stripe/stripe-js`
- On page load, call `create-payment-intent`, get `clientSecret`
- Render Stripe `PaymentElement`
- On submit, call `stripe.confirmPayment()` with redirect to `/checkout/processing`

`CheckoutProcessingPage.tsx`:
- Stripe redirects here with `payment_intent_client_secret` in query params
- Call `stripe.retrievePaymentIntent()` to check status
- If succeeded → redirect to `/checkout/success?ref={order_reference}`
- If failed → redirect back to `/checkout/:productSlug/payment` with error message

---

## Phase 5 — Notifications + Email

Goal: Customer gets confirmation email. Admin gets new order email. Cron job reminds admin of unfulfilled orders daily. Abandoned orders cleaned up.

### Setup

Add to `requirements.txt`: `mailgun` (or just use `requests` to call Mailgun API directly — simpler, no extra package needed)
Add to `.env`: `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `ADMIN_EMAIL`
Add to `settings.py`: read env vars. Configure Django email backend to use Mailgun (django-anymail or direct API calls).

### Backend

New model in `shop/`:
- `Notification` — `order` (FK to Order), `notification_type` (choices: `customer_confirmation`, `admin_new_order`, `admin_reminder`), `sent_at` (DateTimeField, nullable), `status` (choices: `pending`, `sent`, `failed`)

Email utility functions (`shop/utils/email.py`):
- `send_customer_confirmation(order)` — sends order summary to `order.customer_email`. Triggered by webhook.
- `send_admin_new_order(order)` — sends new order alert to `ADMIN_EMAIL`. Triggered by webhook.
- `send_admin_reminder(order)` — sends reminder for unfulfilled order to `ADMIN_EMAIL`. Called by cron.

Cron jobs (use `django-crontab` or management commands + system cron):
- **Daily reminder:** Finds all orders with status `paid` (not yet `dispatched`). For each, calls `send_admin_reminder` and creates/updates Notification record. Run daily.
- **Abandoned order cleanup:** Finds all orders with status `pending_payment` older than 24 hours. Sets status to `cancelled`. Run daily.

---

## Phase 6 — Testing

Goal: Full test coverage across both new apps.

Follow existing project pattern: `pytest` + `pytest-django` + Factory Boy.

Test coverage targets:
- `product` app: model tests, all admin CRUD endpoints, image upload/manage endpoints, public list/detail endpoints (stock filtering, low stock threshold)
- `shop` app: Order creation (happy path, out of stock, invalid data), order reference generation (uniqueness, format), `create-payment-intent` (new, idempotent, staff override, minimum floor, out of stock), webhook handler (`payment_intent.succeeded` happy path, duplicate/idempotent, stock decrement atomicity, `payment_intent.payment_failed`), admin order endpoints, status update endpoint
- Email utilities: mock Mailgun calls, verify correct data sent
- Cron logic: abandoned order cleanup (boundary: exactly 24h vs 23h), reminder (only `paid` orders, not `dispatched`)

---

## Dependency Notes

- Phase 2 depends on Phase 1 (product data must exist)
- Phase 3 depends on Phase 2 (checkout links from product detail page)
- Phase 4 depends on Phase 3 (Order model must exist before Payment)
- Phase 5 depends on Phase 4 (emails triggered by webhook)
- Phase 6 can be written alongside each phase or after all phases

---

## Key Decisions Made

| Decision | Choice |
|---|---|
| Price storage | GST-inclusive in DB |
| Order reference format | `SS-YYYYMMDD-XXXX` (daily sequence) |
| Order model location | `shop` app |
| Brand field on Product | CharField (optional), no FK to avoid cross-app dependency |
| Admin notifications | Email only (no SMS) via Mailgun |
| Email sending | Direct Mailgun API calls via `requests` |
| Stock decrement timing | Immediately in `payment_intent.succeeded` webhook |
| Race condition guard | `F()` expression + `filter(stock_quantity__gt=0)` |
| Abandoned order threshold | 24 hours |
| Admin reminder frequency | Daily (orders with status `paid`) |
| Staff payment override | $1.00, applied in `create-payment-intent` view |
| Stripe customer | Not attached to a customer object (no user accounts) |
