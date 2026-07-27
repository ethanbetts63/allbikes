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
/parts/new/sym/:modelSlug/:sectionId
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
  ├─ Country selects domestic or international flat shipping
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
  └─ Shows the 14-day backorder policy when applicable
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
       ├─ token authorises the payment/confirmation flow
       └─ public confirmation payload contains no customer PII

Stripe webhook
  └─ verifies the Stripe event and, once only:
       ├─ Payment → succeeded
       ├─ PartsOrder → paid
       ├─ starts the 14-day clock on backordered lines
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

### Backorder policy

The Price & Availability feed is advisory, not a live reservation. We request
that the supplier does not ship a partial order when any part is unavailable and
instead tells us the missing parts and ETA. Customer orders are held for up to
14 days; if the missing part cannot be secured, its line is refunded and the
remainder may be shipped.

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
- The pricing importer validates the expected CSV header and minimum row count
  before it can change catalog availability.
- Customer price is `supplier base price × (1 + markup percentage)`, rounded to
  cents. Prices displayed to customers include GST.
- Re-importing a book replaces its diagrams/sections while preserving historical
  order snapshots.
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
| Import pipeline | `parts/ingestion/` |
| Scheduled imports | `parts/management/commands/` |
| Stripe webhook branch | `payments/utils/webhook_handlers.py` |

---

## Status and scope

This document describes the implemented new SYM parts workflow. It does not
cover used parts, other brands, supplier API submission, customer accounts,
individual part pages, automated supplier dispatch, or a fully automated
backorder/refund lifecycle.
