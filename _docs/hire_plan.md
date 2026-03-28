# Hire System Plan

## Overview

A system allowing customers to hire used motorcycles directly from the website. No user accounts — customer details are captured on the booking. Payment handled via Stripe (combined hire fee + bond in a single charge). Built in five stages.

---

## Data Model Decisions

### Rate calculation

Motorcycles can have up to three optional rate fields: `daily_rate`, `weekly_rate`, `monthly_rate`. The `effective_daily_rate` used for a booking is determined at booking creation time by this priority:

1. `daily_rate` if set
2. `weekly_rate / 7` if set
3. `monthly_rate / 30` if set

The calculated `effective_daily_rate` is snapshotted onto the `HireBooking` at creation so price changes to the bike don't affect existing bookings.

`total_hire_amount = effective_daily_rate * number_of_days`

### Bond

A flat bond amount from `HireSettings`. Charged alongside the hire fee in a single Stripe PaymentIntent. Stored separately on the booking for refund reference. Refunds are manual (via Stripe dashboard) for now.

---

## Stage 1 — Admin Interface

The goal of Stage 1 is to have the full admin-side infrastructure in place: models, API endpoints, and admin UI. No public-facing pages yet.

### Backend

**`Motorcycle` model additions**
- `is_hire` — BooleanField, default False
- `daily_rate` — DecimalField, nullable/blank
- `weekly_rate` — DecimalField, nullable/blank
- `monthly_rate` — DecimalField, nullable/blank
- New `status` choice: `on_hire`

**New `HireSettings` model** (singleton, same pattern as `DepositSettings`)
- `enable_hire` — BooleanField, default False (global kill switch)
- `bond_amount` — DecimalField, default $0.00
- `advance_min_days` — IntegerField (minimum days ahead a booking can start), default 1
- `advance_max_days` — IntegerField (maximum days ahead), default 90

**New `HireBooking` model**
- `motorcycle` — ForeignKey to `Motorcycle`, on_delete=PROTECT
- `booking_reference` — auto-generated (same `SS-XXXXXXXX` format as orders)
- `hire_start` — DateField
- `hire_end` — DateField
- `effective_daily_rate` — DecimalField (snapshotted at creation)
- `total_hire_amount` — DecimalField (snapshotted at creation)
- `bond_amount` — DecimalField (snapshotted from HireSettings at creation)
- `customer_name` — CharField
- `customer_email` — EmailField
- `customer_phone` — CharField
- `status` — CharField, choices: `pending_payment` / `confirmed` / `active` / `returned` / `cancelled`
- `notes` — TextField, blank (admin use)
- `created_at` — auto DateTimeField

**API endpoints**
- `GET /api/hire/admin/settings/` — retrieve HireSettings
- `PATCH /api/hire/admin/settings/` — update HireSettings (IsAdminUser)
- `GET /api/hire/admin/bookings/` — paginated list, filterable by status
- `GET /api/hire/admin/bookings/<pk>/` — detail
- `PATCH /api/hire/admin/bookings/<pk>/status/` — manual status update

**Django app**
New `hire` app to keep this isolated from `payments` and `inventory`.

**Migrations**
- New `hire` app migrations
- `inventory` migration for the new `Motorcycle` fields

### Frontend (Admin)

**`AddMotorcyclePage` updates**
Add a "Hire" section to the existing motorcycle edit form:
- `is_hire` toggle
- `daily_rate`, `weekly_rate`, `monthly_rate` fields (all optional, only shown when `is_hire` is on)

**New admin pages**
- `AdminHireSettingsPage` — edit HireSettings (bond amount, min/max advance days, enable_hire toggle)
- `AdminHireDashboardPage` — paginated list of hire bookings with status filter
- `AdminHireDetailPage` — single booking detail view + manual status update dropdown + notes field

**`AdminLayout` sidebar**
Add a "Hire" section:
- Hire Bookings → `/dashboard/hire`
- Hire Settings → `/dashboard/hire-settings`

**`AdminHomePage` widget**
Add a "Hire" attention widget showing bookings in `confirmed` or `active` status (same pattern as the orders widget).

**`App.tsx` routes**
```
/dashboard/hire                → AdminHireDashboardPage
/dashboard/hire/:id            → AdminHireDetailPage
/dashboard/hire-settings       → AdminHireSettingsPage
```

---

## Stage 2 — Public Hire List + Booking Flow (no payment)

The goal of Stage 2 is a working end-to-end flow: customer finds a bike, picks dates, submits details, gets a confirmation. Payment is skipped — bookings are created directly as `confirmed`. This will be updated in Stage 4.

### Backend

**Public endpoints**
- `GET /api/hire/bikes/` — list motorcycles where `is_hire=True`, `status` not `on_hire`. Returns basic fields: id, slug, make, model, year, images, daily_rate, weekly_rate, monthly_rate, condition.
- `GET /api/hire/availability/` — query params: `motorcycle_id`, `start_date`, `end_date`. Returns `{available: true/false}`. Checks for any `HireBooking` on that bike with overlapping dates and status not `cancelled`.
- `POST /api/hire/bookings/` — create a `HireBooking`. Validates: dates are valid, bike is available, rates exist, advance_min/max respected. Calculates `effective_daily_rate` and `total_hire_amount`. Creates booking as `confirmed` (Stage 4 will change this to `pending_payment`). Returns `{booking_reference}`.

### Frontend

**`/hire` — Hire List Page**
- Shows all hire-eligible bikes
- Date range picker (start date / end date) at the top — when dates are selected, re-fetches or filters by availability
- Each bike card: make/model/year, primary image, rate display (daily/weekly/monthly as available), "Book Now" button
- "Book Now" navigates to `/hire/:slug/book` passing dates in router state

**`/hire/:slug/book` — Hire Booking Page**
- Summary of selected bike (image, name, dates, rate breakdown, total)
- Customer details form: `name`, `email`, `phone`
- "Confirm Booking" submits to `POST /api/hire/bookings/`
- On success: navigate to `/hire/confirmation?ref={booking_reference}`

**`/hire/confirmation` — Confirmation Page**
- Shows booking reference, bike name, dates, total amount
- Message: "We'll be in touch to confirm pickup details."
- (In Stage 4 this becomes the post-payment landing page)

**`App.tsx` routes**
```
/hire                     → HireListPage
/hire/:slug/book          → HireBookingPage
/hire/confirmation        → HireConfirmationPage
```

**`NavBar`**
Add a "Hire" link (visible when `enable_hire` is true — or always visible and the list page handles the disabled state).

---

## Stage 3 — Notifications

Wire up emails at booking creation (and later at payment confirmation in Stage 4).

### Backend

**New `message_type` choices on `Message`**
- `hire_confirmation`
- `admin_new_hire`

**New functions in `notifications/utils/email.py`**
- `send_hire_confirmation(hire_booking)` — to customer: booking reference, bike details, dates, total, bond info, "we'll be in touch"
- `send_admin_new_hire(hire_booking)` — to admin: all booking details, customer contact info

**New email templates**
- `notifications/templates/notifications/emails/hire_customer_confirmation.html`
- `notifications/templates/notifications/emails/hire_admin_new_booking.html`

**Wire-up**
- Call both functions after successful `POST /api/hire/bookings/` (outside any DB transaction, same pattern as order webhook handler)
- In Stage 4, move the trigger to the webhook handler post-payment

---

## Stage 4 — Payment

Add Stripe payment between the booking form and confirmation.

### Backend

**`HireBooking` status flow update**
- `POST /api/hire/bookings/` now creates as `pending_payment` (not `confirmed`)
- Returns `{booking_id, booking_reference}` for the frontend to proceed to payment

**New endpoint**
- `POST /api/hire/create-payment-intent/` — receives `booking_id`. Charges `total_hire_amount + bond_amount`. Creates Stripe PaymentIntent in AUD. Stores a reference back to the booking. Returns `{clientSecret}`.

**Webhook handler**
- New branch for hire PaymentIntents (identified by metadata on the intent)
- On `payment_intent.succeeded`: mark booking `confirmed`, flip `motorcycle.status = 'on_hire'`, trigger notifications (move `send_hire_confirmation` and `send_admin_new_hire` calls here from `HireBookingCreateView` — currently they fire at booking creation time, but once payment is required they should fire only after payment succeeds)

**Payment model / tracking**
- Either extend the existing `Payment` model to optionally FK to `HireBooking`, or create a `HirePayment` model. TBD based on how clean the extension looks.

### Frontend

**Updated booking flow**
```
/hire/:slug/book          → collect details → POST /api/hire/bookings/ → POST /api/hire/create-payment-intent/
/hire/:slug/book/payment  → Stripe Elements → confirmPayment() → redirect to processing
/hire/processing          → polling / redirect handling
/hire/confirmation        → confirmed state (shows full amount paid)
```

The existing `CheckoutProcessingPage` pattern (poll for status) can be referenced directly.

---

## Stage 5 — Additional

Items to address once the core flow is working:

- **Hire T&Cs page** — `/hire/terms` linked from the booking form
- **Add hire pages to sitemap** — update `StaticViewSitemap` in `sitemaps.py`
- **Add `/hire` to `robots.txt`**
- **Return reminder email** — `send_hire_return_reminder(hire_booking)` triggered X days before `hire_end` (via management command)
- **Admin calendar view** — visual calendar of active/upcoming hire bookings (nice to have)
- **Cancellation flow** — admin can cancel a booking; bond refund manual via Stripe dashboard
- Any edge cases or gaps discovered during Stages 1–4

---

## What is explicitly out of scope (for now)

- Optional extras / add-ons
- Age verification or licence validation
- Customer accounts
- Automated refunds
- SMS notifications
- Online availability for bikes not flagged `is_hire`
