# New SYM Parts

End-to-end flow for genuine new SYM parts: catalogue ingestion, customer browse
and checkout, payment confirmation, and the operator’s supplier-email workflow.

---

## Customer Flow

```
/parts/new/sym
  ├─ Breadcrumb: Home / New SYM Parts
  ├─ Models grouped by capacity class
  └─ Select a model
       │
       ▼
/parts/new/sym/:modelSlug
  ├─ Breadcrumb: Home / New SYM Parts / [Model]
  ├─ Engine and frame/body section grids
  └─ Select a section
       │
       ▼
/parts/new/sym/:modelSlug/:sectionCode
  ├─ Breadcrumb: Home / New SYM Parts / [Model] / [Section]
  ├─ Exploded diagram
  └─ Numbered parts list
       ├─ Part number, customer price and advisory stock state
       ├─ Colour variants: customer selects the matching colour
       ├─ Running changes: dated variants display separately
       ├─ Not in current PA feed: unavailable and cannot be added
       ├─ Understocked: remains addable as a backorder
       └─ New-part sales disabled: all Add buttons are disabled
            │
            ▼
/parts/cart
  ├─ Cart is stored in the customer’s browser
  ├─ Quantity changes update the backorder indicator
  └─ Checkout
       │
       ▼
/parts/checkout
  ├─ Customer name, email, phone and shipping address
  ├─ Australian delivery address
  ├─ Customer accepts terms and backorder policy
  └─ Continue to payment
       │
       ▼
/parts/checkout/payment
  ├─ Server creates or reuses a Stripe PaymentIntent
  ├─ Stripe Payment Element collects payment
  └─ Successful payment → confirmation page
       │
       ▼
/parts/checkout/confirmation
  ├─ Polls for the Stripe webhook result
  ├─ Shows a payment-confirmed order summary
  └─ Shows the order's Parts Settings backorder period when applicable
```

### Checkout safeguards

- The browser never controls the final price, shipping, or orderability.
- Checkout re-reads the live catalog, recomputes marked-up customer prices, and
  snapshots every line on the order.
- Every line includes the exact selected diagram callout, model and section.
- A customer may buy an understocked part as a backorder; a part absent from the
  current Price & Availability feed cannot be purchased.
- The catalog supports a maximum of 50 distinct lines and 100 of one part in a
  checkout.
- Turning off **Enable new parts sales** disables diagram-page Add buttons and
  makes the checkout API reject new orders.

### Payment and confirmation security

```
Create order
  └─ returns order reference + high-entropy access token
       ├─ token is stored in tab-scoped sessionStorage, never in page URLs
       ├─ confirmation reads send it in X-Customer-Access-Token
       ├─ payment creation sends it in the JSON request body
       └─ public confirmation payload contains no customer PII

Stripe webhook
  └─ verifies the Stripe event and, once only:
       ├─ Payment → succeeded
       ├─ PartsOrder → paid
       ├─ preserves the order's snapshotted backorder policy
       ├─ sends customer confirmation email
       └─ sends admin email and SMS
```

The full order endpoint is staff-only. It is not exposed just by knowing an
`SP-...` order reference.

---

## Admin Flow

```
/dashboard/parts-settings
  ├─ Markup percentage
  ├─ Australian shipping fee
  ├─ Backorder hold period
  └─ Enable new parts sales

/dashboard/parts-orders
  ├─ Search, filters and actionable-first order list
  ├─ Paid orders are the supplier-review queue
  └─ Select an order
       │
       ▼
/dashboard/parts-orders/:id
  ├─ Customer and ship-to details
  ├─ Item snapshots: part number, model, section, callout and price
  ├─ Backorder clock and per-line actions
  ├─ Internal notes
  └─ Email supplier — available only while the order is paid
       │
       ▼
/dashboard/parts-orders/:id/supplier-email
  ├─ Recipient is always blank; it is never stored or prefilled
  ├─ Review/edit subject and message before sending
  ├─ Supplier receives: itemised parts, quantities, supplier prices and ship-to
  │  address, plus the ship-complete/backorder instruction
  ├─ Internal sidebar: supplier cost, customer sale total and gross profit
  └─ Confirm send → Message audit record is created
```

Supplier email sending does not change the order status. The operator keeps the
fulfilment state and any backorder/refund actions under manual control.

For now, refunds are issued in the Stripe Dashboard first and then recorded as
refunded or partially refunded in the parts admin. Changing the admin status
does not move money. Direct Stripe refunds from the admin are planned later.

### Backorder policy

The Price & Availability feed is advisory, not a live reservation. We request
that the supplier does not ship a partial order when any part is unavailable and
instead tells us the missing parts and ETA. The hold period is configured in
Parts Settings and snapshotted onto each order. If a missing part cannot be
secured in that period, its line is refunded and the remainder may be shipped.

---

## Catalogue and Pricing Pipeline

```
Select Portal parts-books page
  ├─ Weekly: scrape SYM .xls books → archive + inbox → import
  └─ Daily: scrape Price & Availability CSV → archive + inbox → import
       │
       ▼
Catalog database
  ├─ PartsModel
  ├─ PartSection + extracted exploded diagram
  ├─ SectionPart (diagram callout and fitment context)
  ├─ Part (part number, price and availability)
  └─ PartsSettings
```

- Source files are archived with a content hash, so an updated file does not
  overwrite a prior archive copy.
- Scheduled commands are `scrape --parts` then `update --parts` for model books,
  and `scrape --prices` then `update --prices` for Price & Availability.
- `update --parts --archive` rebuilds from the newest archived book for every
  model. `update --prices --archive` applies the newest archived pricing CSV.
  Archive recovery reads files in place and never consumes them.
- The pricing importer validates the expected CSV header and minimum row count
  before it can change catalog availability.
- The Price & Availability `RRP+GST` value is the pricing base. Customer price is
  `RRP+GST × (1 + Parts Settings markup percentage)`. Our actual supplier cost is
  `RRP+GST × (1 - PARTS_SUPPLIER_DISCOUNT_PERCENTAGE)`, currently 30% by default.
  All inputs and results are snapshotted on the order line. Admin gross profit is
  shown ex GST as `(customer price - actual supplier cost) ÷ 1.10`; shipping is
  excluded from parts profit and margin.
- Models use their SYM model code as a stable key; sections use model + section
  code; fitments use model + section + callout + part number + effective date.
- Re-importing a book updates those stable records in place, removes source rows
  that disappeared, and preserves public section URLs and browser carts.
- Historical order line snapshots remain independent of later catalogue imports.
- The abandoned-order cleanup cron cancels pending parts orders older than seven
  days, alongside the existing product and hire cleanup.

---

## Key Pages and Files

| Area | Location |
|---|---|
| SYM landing | `frontend/app/parts/new/sym/page.tsx` |
| Model page | `frontend/app/parts/new/sym/[modelSlug]/page.tsx` |
| Diagram and parts list | `frontend/app/parts/[modelSlug]/[sectionId]/PartsSectionPage.tsx` |
| Customer checkout | `frontend/app/parts/checkout/` |
| Admin parts orders | `frontend/app/dashboard/parts-orders/` |
| Parts settings | `frontend/app/dashboard/parts-settings/` |
| Catalog API | `parts/views/catalog_views.py` |
| Checkout/order service | `parts/checkout.py` |
| Checkout API | `parts/views/checkout_views.py` |
| Admin supplier email | `parts/views/admin_order_views.py` |
| Parts models | `parts/models/` |
| Import/parser pipeline | `parts/ingestion/` |
| Command workflows | `parts/management/utils/` |
| Command entry points | `parts/management/commands/scrape.py`, `data_management/management/commands/update.py` |
| Stripe webhook branch | `payments/utils/webhook_handlers.py` |

---

## Status and scope

This document describes the implemented new SYM parts workflow. It does not
cover used parts, other brands, supplier API submission, customer accounts,
individual part pages, automated supplier dispatch, or a fully automated
backorder/refund lifecycle.
