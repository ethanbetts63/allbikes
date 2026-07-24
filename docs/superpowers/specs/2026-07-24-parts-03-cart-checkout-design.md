# ③ Cart + Stripe Checkout — Design

**Date:** 2026-07-24 · **Subsystem 3 of 5** · **Depends on:** ② (catalog API), `payments`
**Parent:** `2026-07-24-parts-00-overview-design.md`

## 1. Purpose & scope

Take a cart of parts through checkout and Stripe payment, creating a paid,
multi-line **PartsOrder**. No user accounts. Reuses the existing Stripe
PaymentIntent + webhook pattern from `payments`.

**In scope:** cart (client-side), order + line-item models, the create-payment-
intent endpoint for parts, webhook handling, the success + "email us to confirm"
page. **Out of scope:** the emails/SMS themselves (④) and wholesaler dispatch (⑤).

## 2. Cart (client-side, no accounts)

- Cart lives in browser storage (localStorage) + React context — matches the
  no-accounts decision; no server-side cart model for MVP.
- Line item shape: `{part_number, ref_number, description, section_id, model_slug,
  qty, unit_price_snapshot}`.
- Prices are **re-validated server-side at checkout** (never trust the client
  snapshot) — see §4.1.
- Cart UI: slide-over / `/parts/cart` page listing items, qty edit, remove,
  subtotal (incl. GST), "Checkout" CTA.

## 3. Data model (in `parts`, mirroring `payments.Order`)

### 3.1 `PartsOrder`
| Field | Type | Notes |
|---|---|---|
| `order_reference` | CharField, unique | generated, e.g. `SP-XXXXXXXX` (parts prefix; SS- is the vehicle orders) |
| `customer_name` | CharField | |
| `customer_email` | EmailField | the "order email" the confirm page references |
| `customer_phone` | CharField, blank | |
| `address_line1/2, suburb, state, postcode` | Char | ship-to (drop-ship destination) |
| `status` | CharField, choices | `pending_payment`, `paid`, `dispatched`, `cancelled`, `refunded` |
| `subtotal` | Decimal | sum of line totals incl. GST, snapshot at order creation |
| `shipping` | Decimal | see O1 |
| `total` | Decimal | subtotal + shipping |
| `amount_paid` | Decimal, null | set by webhook |
| `terms_accepted` | Boolean | |
| `dispatched_at` | DateTimeField, null | set by ⑤ |
| `created_at / updated_at` | auto | |

`order_reference` generated the same way as `payments.Order` (`secrets.token_hex`
+ uniqueness loop), with an `SP-` prefix.

### 3.2 `PartsOrderItem`
| Field | Type | Notes |
|---|---|---|
| `parts_order` | FK → PartsOrder, `related_name='items'`, CASCADE | |
| `part_number` | CharField | **snapshot** (not FK) so catalog re-imports (①/D3) never mutate a placed order |
| `description` | CharField | snapshot |
| `model_name` / `model_code` | CharField | snapshot, for the wholesaler + admin |
| `section_code` / `ref_number` | CharField | snapshot, aids wholesaler lookup |
| `quantity` | PositiveInteger | |
| `unit_price` | Decimal | snapshot, incl. GST |
| `line_total` | Decimal | `unit_price * quantity` |

Rationale for snapshots: an order is an immutable record of what was bought at a
price; ①'s delete-and-recreate re-import must never alter historical orders.

### 3.3 `Payment` link (in `payments`)
Add a nullable `parts_order = OneToOneField('parts.PartsOrder', ...)` to
`payments.Payment`, exactly mirroring the existing `order` / `hire_booking`
fields. One migration.

## 4. Checkout flow

Mirrors the vehicle flow (`CreatePaymentIntentView` + webhook) but for many lines.

### 4.1 Create order + payment intent — `POST /api/parts/checkout/`
1. Receive `{customer fields, address, terms_accepted, items:[{part_number, qty}]}`.
2. **Server-side revalidation** of every line against the live `Part` table:
   - part exists and `in_pa_feed` and `price != null` (orderable) — else 409 with
     the offending part numbers so the UI can flag them;
   - recompute `unit_price` from `Part.price_rrp_incl_gst` (ignore client price);
   - `available_qty` is advisory — do **not** block on it for MVP (drop-ship;
     wholesaler confirms), but include a soft warning flag in the response if
     `qty > available_qty`.
3. Create `PartsOrder` (`pending_payment`) + `PartsOrderItem`s with snapshots and
   computed totals.
4. Create a Stripe PaymentIntent for `total` (AUD, `automatic_payment_methods`),
   `metadata = {parts_order_id, order_reference}`; create `Payment(status=pending,
   parts_order=…)`. Reuse the idempotency logic (reuse pending Payment if amount
   matches, else cancel+recreate).
5. Return `{clientSecret, order_reference}`.

Implementation note: factor the shared PaymentIntent create/idempotency logic so
`parts` and `payments` don't duplicate it (small refactor of
`create_payment_intent_view`), or add a sibling `CreatePartsPaymentIntentView`.
Prefer a shared helper.

### 4.2 Payment confirmation — Stripe Elements
Frontend confirms the intent with Stripe.js exactly as the vehicle checkout does,
then routes to the success page on `succeeded`.

### 4.3 Webhook — extend `handle_payment_intent_succeeded`
The existing handler branches on `hire_booking_id` else `order`. Add a branch:
if `payment.parts_order_id` → mark `PartsOrder.status='paid'`,
`amount_paid=payment.amount`; then (outside the transaction) call the parts
notification senders (④). No stock decrement (drop-ship; stock isn't ours).
Keep idempotency (return if already `succeeded`).

### 4.4 Success + "email us to confirm" page
Route: `/parts/order/[order_reference]` (or a success page keyed by the ref).
- Confirms payment received, shows the order summary + reference.
- **The confirm step:** copy asks the customer to **email us from the same email
  they ordered with** so we can verify and answer questions, e.g.:
  > *"Your order **SP-1A2B3C4D** is paid. Please email **admin@scootershop.com.au**
  > from **<their order email>** and quote your reference so we can confirm
  > dispatch details."*
- This replaces user accounts as the identity/verification mechanism (overview
  §5). No login, no password.

## 5. Abandoned orders

Reuse the existing `cleanup_abandoned_orders` pattern: a management command (or
extend the existing one) cancels `PartsOrder`s stuck in `pending_payment` beyond a
TTL and cancels their Stripe intents. No stock to release.

## 6. Error handling

- Line no longer orderable at checkout → 409 + list; UI removes/greys those lines
  and asks the user to review before retrying.
- Price changed between add-to-cart and checkout → server price wins; UI shows the
  updated total before payment confirmation.
- Payment fails → order stays `pending_payment`, user can retry (same as vehicle
  flow). Webhook `failed` handler already covers this generically.
- Empty cart / missing required fields → 400 with field errors.

## 7. Testing

- **Model:** reference generation uniqueness; `line_total`/`total` computation;
  snapshot fields populated.
- **Checkout view:** revalidation rejects unorderable/absent parts; recomputes
  price from server; creates order+items+intent; idempotent re-post reuses intent.
- **Webhook:** parts branch flips status to `paid`, sets `amount_paid`, triggers
  (mocked) notifications; idempotent on replay; does not touch product stock.
- **Cleanup:** stale pending parts order cancelled + intent cancelled.
- Factories for `PartsOrder`/`PartsOrderItem` alongside existing payment factories.

## 8. Open decisions (for review)

- **O1 — Shipping cost:** MVP options: (a) flat AUD fee, (b) free (baked into
  margin), (c) computed later. Spec leaves a `shipping` field; **default flat fee,
  value TBD**. Needs your call — affects totals + wholesaler economics.
- **O2 — Min order / handling:** any minimum order value for drop-ship? Default
  none.
- **O3 — Availability blocking:** MVP does **not** block ordering parts with
  `available_qty < qty` (drop-ship; wholesaler confirms), only soft-warns. Confirm.
- **O4 — Reference prefix:** `SP-` for parts vs `SS-` for vehicle orders. Confirm.
- **O5 — Shared vs. duplicated PaymentIntent helper:** prefer extracting a shared
  helper; confirm appetite for the small `payments` refactor.

## 9. Definition of done

A cart checks out: server revalidates + prices lines, creates a paid multi-line
`PartsOrder` via Stripe, the webhook marks it paid, and the customer lands on a
success page instructing them to email us from their order email. Notifications
are wired in ④.
