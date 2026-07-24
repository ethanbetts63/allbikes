# ③ Cart + Stripe Checkout — Design

**Date:** 2026-07-24 · **Subsystem 3 of 5** · **Depends on:** ② (catalog API), `payments`
**Parent:** `sym_parts_00_overview.md`

## 1. Purpose & scope

Take a cart of parts through checkout and Stripe payment, creating a paid,
multi-line **PartsOrder**. No user accounts. Reuses the existing Stripe
PaymentIntent + webhook pattern from `payments`.

**In scope:** cart (client-side), order + line-item models, the create-payment-
intent endpoint for parts, webhook handling, the success + "email us"
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
| `country` | CharField | ISO/name; defaults `Australia`. Drives domestic vs international shipping |
| `is_international` | BooleanField | derived from `country != AU` at order creation; snapshot |
| `status` | CharField, choices | `pending_payment`, `paid`, `dispatched`, `cancelled`, `refunded` |
| `has_backorder` | BooleanField | true if any line was understocked at order time (advisory) |
| `subtotal` | Decimal | sum of line totals incl. GST (marked-up), snapshot at order creation |
| `shipping` | Decimal | flat fee from `PartsSettings` (domestic or international), snapshot |
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
| `part_number` | CharField | **snapshot** full number incl. colour suffix (not FK) so catalog re-imports (①/D3) never mutate a placed order |
| `description` | CharField | snapshot |
| `colour_name` | CharField, blank | snapshot, for customer/admin/wholesaler clarity |
| `model_name` / `model_code` | CharField | snapshot, for the wholesaler + admin |
| `section_code` / `ref_number` | CharField | snapshot, aids wholesaler lookup |
| `quantity` | PositiveInteger | |
| `unit_price` | Decimal | snapshot, customer price incl. GST (already marked-up) |
| `line_total` | Decimal | `unit_price * quantity` |
| `backordered` | BooleanField | snapshot: `available_qty < quantity` at order time |

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
   - part exists and `in_pa_feed` and `wholesale_price_incl_gst != null`
     (orderable) — else 409 with the offending part numbers so the UI can flag them;
   - recompute `unit_price` = `wholesale_price_incl_gst × (1 +
     PartsSettings.markup_percentage/100)`, rounded 2dp (ignore client price);
   - `available_qty` is advisory — **backorders allowed**: do **not** block when
     `qty > available_qty`; set the line's `backordered` flag and the order's
     `has_backorder`. Only absence from the PA feed blocks (409).
3. Create `PartsOrder` (`pending_payment`) + `PartsOrderItem`s with snapshots
   (incl. `colour_name`, `backordered`) and computed totals. Compute `shipping`
   from `PartsSettings` by destination: `is_international ? international_shipping_fee
   : domestic_shipping_fee`. `total = subtotal + shipping`.
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

### 4.4 Success + "email us" page
Route: `/parts/order/[order_reference]` (or a success page keyed by the ref).
- Confirms payment received, shows the order summary + reference.
- **The email-us step:** copy asks the customer to **email us from the same email
  they ordered with**, quoting their reference, so we can link the order to their
  email, e.g.:
  > *"Your order **SP-1A2B3C4D** is paid. Please email **admin@scootershop.com.au**
  > from **<their order email>** and quote your reference so we can link this order
  > to your email."*
- This replaces user accounts as the identity mechanism (overview §5). No login,
  no password. **No pre-dispatch confirmation is promised to the customer.**

## 5. Abandoned orders

Reuse the existing `cleanup_abandoned_orders` pattern: a management command (or
extend the existing one) cancels `PartsOrder`s stuck in `pending_payment` beyond a
TTL and cancels their Stripe intents. No stock to release.

### 5.1 Backorder handling (MVP scope + deferred)

**MVP:** stock is advisory. A part in the PA feed but understocked
(`available_qty < qty`, incl. 0) is orderable; the line is flagged `backordered`
and the order `has_backorder`. The customer sees a "backorder — ships when
restocked" note at add-to-cart, checkout, and on the confirmation. The operator
sees flagged lines on the admin order and resolves timing with the wholesaler by
email (part of the ⑤ dispatch review). No automatic partial dispatch, no
auto-refund, no stock reservation.

**Deferred (post-MVP, own spec later):** structured backorder lifecycle —
customer notifications on restock/ETA, partial dispatch + partial refund, and
per-line backorder status. Flagged here so the data model already carries the
`backordered` / `has_backorder` fields to build on.

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

- **O1 — Shipping cost:** decided — flat fee by destination
  (`domestic_shipping_fee` / `international_shipping_fee`) from `PartsSettings`.
  Actual fee **values** are operator-set in the dashboard (not hard-coded).
- **O2 — Min order / handling:** any minimum order value for drop-ship? Default
  none.
- **O3 — Availability blocking:** decided — understocked parts are **backorderable**
  (order proceeds, `backordered`/`has_backorder` flagged). Only parts absent from
  the PA feed are blocked. A fuller backorder workflow is deferred (§5.1).
- **O4 — Reference prefix:** `SP-` for parts vs `SS-` for vehicle orders. Confirm.
- **O5 — Shared vs. duplicated PaymentIntent helper:** prefer extracting a shared
  helper; confirm appetite for the small `payments` refactor.

## 9. Definition of done

A cart checks out: server revalidates + prices lines, creates a paid multi-line
`PartsOrder` via Stripe, the webhook marks it paid, and the customer lands on a
success page instructing them to email us from their order email. Notifications
are wired in ④.
