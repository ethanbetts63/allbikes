# Hire Booking

End-to-end flow for hiring a motorcycle — from browsing to confirmation — and the corresponding admin workflow.

---

## User Flow

```
/motorcycle-hire  (HireLandingPage)
  ├─ SEO landing page — hero, how it works, featured fleet, areas, FAQs
  └─ "Check Availability" CTA → /hire
       │
       ▼
  /hire  (HireListPage / Home Page CTA)
       ├─ Date picker: Pick-up Date + Return Date
       ├─ "Check Availability" button → re-fetches bikes for those dates
       └─ Bike grid (all hire bikes shown until dates are selected)
            ├─ Image, make/model/year, daily rate
            ├─ "Book Now" button (disabled until dates selected)
            └─ Click "Book Now" → /hire/book?bike=<id>&start=<date>&end=<date>
                 │
                 ▼
            /hire/book  (HireBookingPage)
                 ├─ Booking summary card
                 │    ├─ Bike image + name
                 │    ├─ Hire dates
                 │    ├─ Daily rate
                 │    ├─ Duration (days)
                 │    ├─ Hire total
                 │    ├─ Bond (refundable)
                 │    └─ Total charged today
                 │
                 ├─ Customer details form
                 │    ├─ Full Name *
                 │    ├─ Email Address *
                 │    ├─ Phone Number *
                 │    └─ Terms and Conditions checkbox (required)
                 │
                 └─ "Continue to Payment" button
                      │
                      │  On submit:
                      │    POST /api/hire/bookings/
                      │      └─ Validates dates, availability, rates
                      │      └─ Creates HireBooking (status: pending_payment)
                      │         Returns: booking_id, booking_reference
                      │
                      │    POST /api/hire/create-payment-intent/
                      │      └─ Amount = total_hire_amount + bond_amount
                      │      └─ Creates Stripe PaymentIntent + local Payment record
                      │         Returns: clientSecret
                      │
                      │  Navigate → /hire/book/<booking_reference>/payment
                      │    (clientSecret + bookingReference + bookingSummary via router state)
                      │
                      ▼
            /hire/book/<booking_reference>/payment  (HirePaymentPage)
                 ├─ Booking summary card (same details as above)
                 ├─ Booking reference displayed
                 ├─ Stripe <Elements> wrapper (clientSecret)
                 │    └─ <PaymentElement>  (card, Apple Pay, Google Pay etc.)
                 └─ "Pay Now" button
                      │
                      │  On submit: stripe.confirmPayment({ redirect: "if_required" })
                      │
                      ├─ [No redirect — most cards]
                      │    ├─ status: succeeded  → navigate to /hire/confirmation/<booking_reference>
                      │    └─ status: requires_payment_method → show inline error, user retries
                      │
                      └─ [Redirect — 3DS cards]
                           Stripe redirects to /hire/processing?payment_intent_client_secret=...&ref=<booking_reference>
                                │
                                ▼
                           /hire/processing  (HireProcessingPage)
                                ├─ Spinner shown while polling
                                ├─ stripe.retrievePaymentIntent(clientSecret)
                                │    ├─ succeeded        → /hire/confirmation/<booking_reference>
                                │    ├─ processing       → poll every 2s, up to 30s, then redirect anyway
                                │    └─ requires_payment_method → /hire/book/<ref>/payment (with error in state)
                                │
                                ▼
                           /hire/confirmation/<booking_reference>  (HireConfirmationPage)
                                ├─ Emerald check mark
                                ├─ Booking reference (monospace block)
                                └─ Booking summary: bike, dates, pricing breakdown, customer details
                                     └─ If page is refreshed: fetches GET /api/hire/bookings/<reference>/

  [Async — after browser is done]
       │
       ▼
  Stripe webhook → POST /api/payments/webhook/
       ├─ Signature verified
       ├─ payment_intent.succeeded
       │    ├─ Idempotency check (skip if already succeeded)
       │    ├─ Payment.status = succeeded
       │    ├─ HireBooking.status = confirmed
       │    ├─ Email → customer (hire confirmation)
       │    └─ Email → admin (new hire notification)
       │
       └─ payment_intent.payment_failed
            ├─ Payment.status = failed
            └─ HireBooking stays pending_payment (customer can retry)
```

---

## Admin Flow

```
/dashboard/hire  (AdminHireDashboardPage)
  ├─ Status filter tabs (All / Pending / Confirmed / Active / Returned / Cancelled)
  ├─ Table: Reference, Bike, Customer, Dates, Total, Status, Delete button
  ├─ Delete button (per row) — hard deletes with confirmation prompt
  └─ Click row → /dashboard/hire/:id
       │
       ▼
  /dashboard/hire/:id  (AdminHireDetailPage)
       ├─ Header
       │    ├─ Booking reference + status badge  [left]
       │    ├─ Status dropdown + "Update Status" button  [right]
       │    └─ "Delete" button  [right]
       │
       ├─ Hire Details
       │    ├─ Motorcycle name
       │    ├─ Hire period (start → end, N days)
       │    ├─ Effective daily rate
       │    ├─ Hire total
       │    ├─ Bond amount
       │    └─ Total charged
       │
       ├─ Customer
       │    ├─ Name
       │    ├─ Email
       │    └─ Phone
       │
       ├─ Notes (editable via status update)
       │
       └─ ← Back to Hire Bookings  [bottom left]
```

### Status Lifecycle

```
pending_payment
      │
      │  (webhook: payment_intent.succeeded)
      ▼
  confirmed      ← admin sees this first; bike is reserved
      │
      │  (admin: customer collects bike)
      ▼
   active        ← bike is out on hire
      │
      │  (admin: bike returned and inspected)
      ▼
  returned       ← hire complete; bond refund can be processed manually

      ├─ cancelled  (can be set from any status by admin)
```

Bond refunds are not automated. Once the booking is `returned` and inspection is complete, the admin manually processes a partial or full refund of the bond via the Stripe dashboard.

---

## Data Model

**`HireBooking`** (`hire/models/hire_booking.py`)

| Field | Type | Notes |
|---|---|---|
| `motorcycle` | FK → `inventory.Motorcycle` | `on_delete=PROTECT` |
| `booking_reference` | CharField | Auto-generated `HR-XXXXXXXX` (8 hex chars) on first save |
| `hire_start` | DateField | |
| `hire_end` | DateField | |
| `effective_daily_rate` | DecimalField | Cheapest rate at booking time (snapshot — not live) |
| `total_hire_amount` | DecimalField | `effective_daily_rate × num_days` |
| `bond_amount` | DecimalField | Snapshot from `HireSettings` at booking time |
| `customer_name` | CharField | |
| `customer_email` | EmailField | |
| `customer_phone` | CharField | |
| `status` | CharField | See status lifecycle above |
| `terms_accepted` | BooleanField | Must be `True` at creation |
| `notes` | TextField | Admin-only, internal use |
| `created_at`, `updated_at` | DateTimeField | auto |

**Properties:**
- `num_days` → `(hire_end - hire_start).days + 1` (inclusive)
- `total_charged` → `total_hire_amount + bond_amount`

**`HireSettings`** (`hire/models/hire_settings.py`)

Singleton (always `pk=1`). Accessed via `HireSettings.get()`.

| Field | Type | Notes |
|---|---|---|
| `bond_amount` | DecimalField | Snapshotted onto each booking at creation time |
| `advance_min_days` | IntegerField | Minimum days ahead a booking can start |
| `advance_max_days` | IntegerField | Maximum days ahead a booking can start |

---

## Rate Calculation

At booking creation, the backend calculates the cheapest effective daily rate from the motorcycle's configured rates:

```python
candidates = []
if daily_rate > 0:   candidates.append(daily_rate)
if weekly_rate > 0:  candidates.append(weekly_rate / 7)
if monthly_rate > 0: candidates.append(monthly_rate / 30)

effective_daily_rate = min(candidates)  # 400 if no rates configured
total_hire_amount = effective_daily_rate * num_days
```

This rate is snapshotted onto the booking — changes to the motorcycle's rates after booking do not affect existing bookings.

---

## Availability Logic

A bike is considered **unavailable** for a date range if it has an existing booking with status `confirmed`, `active`, or `returned` that overlaps those dates.

Bookings with status `pending_payment` or `cancelled` do **not** block availability. This means multiple customers can reach the payment step for the same bike at the same time — only the first to successfully pay gets the confirmed booking.

---

## Key Pages & Files

| Page | Route | File |
|---|---|---|
| Hire landing | `/motorcycle-hire` | `src/pages/HireLandingPage.tsx` |
| Hire list | `/hire` | `src/pages/HireListPage.tsx` |
| Booking details | `/hire/book` | `src/pages/HireBookingPage.tsx` |
| Payment | `/hire/book/:ref/payment` | `src/pages/HirePaymentPage.tsx` |
| Processing (3DS) | `/hire/processing` | `src/pages/HireProcessingPage.tsx` |
| Confirmation | `/hire/confirmation/:ref` | `src/pages/HireConfirmationPage.tsx` |
| Admin — list | `/dashboard/hire` | `src/pages/admin/AdminHireDashboardPage.tsx` |
| Admin — detail | `/dashboard/hire/:id` | `src/pages/admin/AdminHireDetailPage.tsx` |

| Backend | File |
|---|---|
| HireBooking + HireSettings models | `hire/models/` |
| Public views (booking, availability, settings) | `hire/views/public_hire_views.py` |
| Payment intent creation | `hire/views/public_hire_views.py` (`HireCreatePaymentIntentView`) |
| Admin booking views | `hire/views/admin_hire_booking_views.py` |
| Admin settings view | `hire/views/admin_hire_settings_views.py` |
| Hire bike list view | `hire/views/hire_bike_views.py` |
| Availability utility | `hire/utils/availability.py` |
| Webhook handling | `payments/utils/webhook_handlers.py` |
| URL config | `hire/urls.py` |
