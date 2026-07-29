# Product Order / Bike Order Split Plan

## Objective

Replace the mixed `payments.Order` model with two domain models:

- `product.ProductOrder` for full e-scooter/product purchases.
- `inventory.BikeOrder` for motorcycle deposits and reservations.

`HireBooking` and `PartsOrder` remain independent. `Payment` remains the single
Stripe payment record, but it will point to exactly one of the four paid domains.

## Implementation status

Implemented locally on 29 July 2026. The parts/order application has not been
deployed and the local order data is test-only, so the expand, copy, reconcile,
and contract steps are contained in one unapplied migration sequence rather
than a multi-release production rollout.

- `product.ProductOrder` and `inventory.BikeOrder` are independent models.
- New references use `PR-` and `BK-`; migrated references are preserved.
- Public detail/payment calls require the high-entropy access token.
- Checkout tokens are stored in tab-scoped `sessionStorage`, excluded from
  URLs, and sent in `X-Customer-Access-Token` for detail reads.
- Product price and bike deposit amounts are snapshotted at order creation.
- `Payment` has four explicit targets and a database exactly-one constraint.
- Legacy rows, payments, and notification content types are migrated before the
  legacy `payments.Order` table is removed.
- Product, bike, hire, and parts use the same payment-intent retry helper while
  retaining domain-specific eligibility and amount rules.
- Customer checkout uses explicit product/bike APIs, and admin has separate
  Product Orders and Bike Orders lists.
- No legacy compatibility endpoint was retained because this application has
  not been deployed and there are no production checkout links to preserve.

---

## Investigated current state

The existing `payments.Order` is two workflows sharing one row:

| Concern | Product order | Bike order |
|---|---|---|
| Item | `product.Product` (currently the e-scooter store) | `inventory.Motorcycle` |
| Charge | Full live product/discount price | Live `DepositSettings.deposit_amount` |
| Required customer data | Australian delivery address; phone optional | Phone required; no delivery address |
| Item-specific data | Product and stock | Motorcycle and selected colour |
| Successful webhook | Marks paid and decrements product stock | Marks deposit paid and changes `for_sale` motorcycle to `reserved` |
| Customer/admin copy | Product purchase and delivery | Deposit/reservation and pickup contact |

The mixed model therefore needs nullable `product` and `motorcycle` fields,
`payment_type`, conditional serializer validation, conditional payment amounts,
conditional webhook behaviour, conditional emails, and conditional admin UI.

The other two paid domains are materially different again:

- `HireBooking` owns dates, rate/bond/extras snapshots, availability rules and a
  hire-specific lifecycle.
- `PartsOrder` owns multiple line snapshots, delivery, shipping, backorders,
  partial refunds, supplier communication and a parts-specific lifecycle.

### Why there should not be a shared order base model

Across all four domains, the apparent overlap is limited to a reference,
customer contact fields, a status-shaped field, terms acceptance and timestamps.
Those fields do not have fully shared semantics:

- Hire uses `booking_reference`; the others use `order_reference`.
- Status choices and valid transitions differ in every domain.
- `amount_paid` belongs to some order rows while hire currently gets its charged
  amount from `Payment`.
- Address, access-token, fulfilment and pricing requirements differ.
- Terms represent different agreements and are accepted at different events.

An abstract Django model would avoid a small amount of field repetition but
would couple four migrations and encourage false shared behaviour. A concrete
parent table would be worse because it would add multi-table inheritance joins
and another identity/lifecycle to keep consistent.

**Decision:** use four independent domain models. Duplicate the small set of
stable columns deliberately. Share only stateless helpers or payment orchestration
where the behaviour is genuinely identical.

---

## Target model design

### `product.ProductOrder`

Suggested fields:

- `product` — protected foreign key.
- `order_reference` — immutable customer reference; new prefix `PR-`.
- `access_token` — high-entropy token for anonymous payment/confirmation reads.
- `customer_name`, `customer_email`, `customer_phone`.
- `address_line1`, `address_line2`, `suburb`, `state`, `postcode`, `country`.
- `unit_price_incl_gst` — effective product price snapshotted at order creation.
- `total`, `amount_paid`.
- `status`, `terms_accepted`, `created_at`, `updated_at`.

Initial statuses can preserve current behaviour: `pending_payment`, `paid`,
`completed`, `cancelled`, `refunded`. Product-specific transitions can be
tightened independently later.

### `inventory.BikeOrder`

Suggested fields:

- `motorcycle` — protected foreign key.
- `order_reference` — immutable customer reference; new prefix `BK-`.
- `access_token` — high-entropy token for anonymous payment/confirmation reads.
- `customer_name`, `customer_email`, `customer_phone`.
- `selected_colour`.
- `deposit_amount` — `DepositSettings` value snapshotted at order creation.
- `amount_paid`.
- `status`, `terms_accepted`, `created_at`, `updated_at`.

The original structural migration preserved manual motorcycle availability.
Subsequent payment-safety work now changes `for_sale` to `reserved` after a
successful deposit without overwriting stronger manual states.

### `payments.Payment`

Replace `order` with:

- `product_order` — nullable foreign key.
- `bike_order` — nullable foreign key.
- Existing `hire_booking` — nullable foreign key.
- Existing `parts_order` — nullable foreign key.

Add a database `CheckConstraint` requiring **exactly one** target. Keep the
unique Stripe PaymentIntent ID. Multiple attempts per target are retained for
audit history.

Do not use `GenericForeignKey` for payments. Explicit foreign keys provide
database integrity, predictable joins and safe cascades.

---

## Shared code without shared models

Use small, explicit services rather than model inheritance:

1. A Stripe intent helper can own amount-to-cents conversion, creation,
   retrieval/cancellation and retry/idempotency mechanics.
2. Each domain remains responsible for eligibility and amount calculation:
   product stock and price, bike availability and deposit, hire dates/totals,
   and parts order totals.
3. Webhook dispatch should resolve the one populated payment target and call a
   domain handler such as `complete_product_payment(payment)` or
   `complete_bike_payment(payment)`.
4. Reference/token generation can use a small utility if it stays stateless;
   each model retains its own prefix and uniqueness check.
5. Do not introduce serializer mixins or a universal frontend `Order` type.
   Use explicit `ProductOrder`, `BikeOrder`, `HireBooking` and `PartsOrder` types.

This keeps Stripe plumbing DRY without pretending the order lifecycles are the
same.

---

## API and frontend target

Backend endpoints should be domain-explicit. Exact URL names can follow the
project's final routing convention, but the resources should be separate:

```text
POST /api/product/orders/
GET  /api/product/orders/:reference/  [X-Customer-Access-Token]
POST /api/product/orders/:reference/payment-intent/

POST /api/inventory/bike-orders/
GET  /api/inventory/bike-orders/:reference/  [X-Customer-Access-Token]
POST /api/inventory/bike-orders/:reference/payment-intent/
```

Admin list/detail/status APIs should also be separate. The existing combined
dashboard may either become two pages (`product-orders` and `bike-orders`) or a
thin combined presentation backed by two explicit APIs. It must not recreate a
mixed backend model merely to keep one table.

The customer checkout can retain shared visual components, but submission,
payment loading and confirmation must use a discriminated product/bike flow—no
unchecked `?type=` cast deciding which model an arbitrary payload creates.

Both new public flows should adopt token-protected reads like Parts checkout.
The current legacy order endpoint exposes customer/order data to anyone who
knows its relatively short reference; the split is the appropriate time to stop
carrying that design forward.

---

## Safe migration sequence

The original product/bike system may contain production history. Use an
expand/migrate/contract sequence; do not replace the table in one destructive
migration.

### Phase 0 — tests and production audit

- Count legacy orders grouped by `product_id`/`motorcycle_id` and status.
- Assert every legacy order has exactly one item target.
- Audit every `Payment.order_id`, including failed and pending payments.
- Audit every notification `Message` whose content type is legacy `Order`.
- Record counts and primary-key/reference sets as migration reconciliation data.
- Add fixtures covering paid, pending, cancelled and refunded rows of both types.

Stop if an order has neither/both targets or a payment/message cannot be mapped
unambiguously. Do not guess or delete it.

### Phase 1 — expand schema

- Add `ProductOrder` and `BikeOrder` tables without removing `Order`.
- Add nullable `Payment.product_order` and `Payment.bike_order` fields.
- Keep `Payment.order` temporarily for rollback and old-code compatibility.
- Do not add the final exactly-one constraint yet because the transition
  temporarily retains the old and new relationships.

### Phase 2 — deterministic data migration

- Copy product-linked legacy orders to `ProductOrder`.
- Copy motorcycle-linked legacy orders to `BikeOrder`.
- Preserve legacy primary keys, `SS-...` references, statuses, customer data,
  terms flags, amount paid and original timestamps.
- Generate access tokens for migrated rows.
- Populate each Payment's new target according to its legacy order type while
  retaining `Payment.order` temporarily.
- Move generic notification `Message.content_type` from legacy `Order` to the
  corresponding new model. Preserved primary keys allow `object_id` to remain
  unchanged.

Historical snapshot rules need to be explicit:

- Product price: prefer `amount_paid` for completed charges; otherwise use the
  associated Payment amount; only fall back to the current effective product
  price when neither exists.
- Bike deposit: prefer the associated Payment amount, then `amount_paid`, then
  the current Deposit Settings value.
- Log/count every fallback because a fallback is reconstructed history, not a
  guaranteed original snapshot.

### Phase 3 — switch application reads and writes

- Split creation serializers and views.
- Snapshot product price and bike deposit at creation; payment intent creation
  must charge the snapshot rather than rereading mutable settings/catalogue.
- Update PaymentIntent metadata to identify the explicit target type/reference.
- Update webhook success/failure handling and email/SMS dispatch.
- Update admin lists, details, notifications and status actions.
- Update cleanup of abandoned orders to query both new models.
- Update Django admin registrations, factories and all backend tests.
- Split frontend API/types and migrate checkout, processing, success and admin
  screens to the appropriate resource.
- Keep a compatibility reader for old `/api/payments/orders/:reference/` links
  during the transition; it may resolve the reference and return/redirect to the
  correct new resource but must not accept new writes.

### Phase 4 — reconciliation gate

Before removing anything, verify:

- Legacy product count equals `ProductOrder` migrated count.
- Legacy bike count equals `BikeOrder` migrated count.
- All references, statuses, amounts, customers and timestamps match.
- Every legacy-linked Payment has exactly one new target and the same Stripe ID.
- Every migrated Message resolves to its new content object.
- Stripe webhook replay is idempotent for all four targets.
- Existing paid order confirmation/admin links still resolve.

Take a database backup immediately before the contract migration.

### Phase 5 — contract schema

- Stop writing/reading `Payment.order` and set it to null after reconciliation.
- Add the exactly-one-of-four Payment check constraint.
- Remove `Payment.order`.
- Remove legacy serializers, views, factories and compatibility writes.
- Remove the legacy `Order` model/table only after an additional deployed
  verification window.

If a rollback is needed before Phase 5, the legacy table and relationship remain
available. After Phase 5, rollback requires the pre-contract database backup.

---

## Existing behaviour to resolve separately

These were discovered while tracing the split. They should receive explicit
decisions and tests, not accidental behaviour changes inside the migration:

1. A successful bike deposit email says the motorcycle is reserved, but the
   webhook deliberately leaves `Motorcycle.status = for_sale` for manual admin
   handling. The wording and business rule currently disagree.
2. Multiple customers can create pending deposit orders for the same motorcycle.
   The split alone does not solve competing successful payments.
3. A product's stock may reach zero between PaymentIntent creation and webhook;
   the webhook still marks the order paid and only logs the failed decrement.
4. The legacy public order-detail endpoint is reference-only rather than
   token-protected.

Recommended sequencing: complete the structural split without changing
reservation/stock policy, except for adding token-protected reads and immutable
amount snapshots. Address reservation and oversell policy in a dedicated follow-up
with agreed customer/refund behaviour.

---

## Required test coverage

- Model tests for references, snapshots and domain-specific required fields.
- Payment database tests rejecting zero targets and every multi-target pairing.
- Creation tests proving product payloads cannot create bike orders and vice versa.
- Amount tests proving later product/deposit-setting changes do not alter charges.
- Concurrent/retry PaymentIntent tests for each domain.
- Webhook success, failure and replay tests for all four target types.
- Product stock decrement occurs once; bike flow never enters the product branch.
- Customer/admin email and SMS dispatch uses the correct domain templates.
- Data-migration tests covering every status and historical amount fallback.
- Message content-type migration and audit-history preservation tests.
- Compatibility-link tests for migrated `SS-...` references.
- Frontend typecheck/lint plus product and bike checkout/payment/confirmation
  integration tests.

## Completion criteria

The refactor is complete only when no runtime code imports `payments.Order`, all
payments have exactly one of the four explicit targets, historical payments and
messages reconcile, new charges use immutable order snapshots, and both customer
and admin flows operate without a mixed order discriminator.
