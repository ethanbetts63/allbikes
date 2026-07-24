# SYM Parts Platform — System Overview & Decomposition

**Date:** 2026-07-24
**Status:** Design / MVP
**Owner:** Ethan

## 1. Purpose

Sell genuine SYM spare parts on scootershop.com.au via a **drop-ship** model: the
customer orders and pays us; our wholesaler (Select Portal) ships the parts
directly to the customer. The customer experience mirrors the *flow* (not the
look) of easyparts.com; the wholesale data comes from Select Portal's public
parts books and price/availability feed.

The whole system must be **completely automated**: data ingestion, pricing
updates, ordering, payment, and notifications all run without manual data entry.
The only manual step is the operator reviewing each paid order before it is
forwarded to the wholesaler (subsystem ⑤), which also serves as a human check
against wrong-variant orders.

## 2. Key domain facts (established during research)

- **Source of truth:** <https://www.selectportal.com.au/sym-spare-parts-books/>.
  This single page links every model's parts book (`.xls`) and the current
  **Price & Availability** CSV. Both are direct, stable URLs.
- **~50 model books**, grouped by cc class (50cc / 100–165cc / 200–400cc / ATV).
  Each `.xls` is one model, keyed by SYM **model code** (e.g. `AX15W2-6`).
- **Book internals** (verified by parsing a sample book with `xlrd` +
  `olefile` + `Pillow`):
  - Sheets `E01–E14` (engine) and `F01–F23` (frame) each hold **one exploded
    diagram image + a numbered parts table**: `ref no. | part number |
    description | qty | effective date | superseded flag`.
  - Diagram images are embedded as Escher BStore BLIP records; they extract
    deterministically in pure Python (no LibreOffice/OCR). Sample book: 86 BLIPs,
    84 decoded cleanly. Each section sheet references its diagram via a `pib`
    blip index in its drawing record.
  - Index sheets (`Eng. group1/2`, `Frame group1/2`) map section code → name.
    `No.index*` is a part→section cross-reference (redundant with the section
    tables we build; optional validation only).
- **Price & Availability CSV** is keyed by **part number only**:
  `PART NUMBER, DESCRIPTION, AVAILABLE, RRP+GST, ADD GST`. Filename + path encode
  the publish date (e.g. `/uploads/2026/07/PA-16-Jul-26.csv`).
- **"Year"** is **not** a navigation dimension. Broad year differences already
  produce a separate model code / book. Within a book, running changes appear as
  multiple dated part variants under the *same* diagram callout. We therefore
  navigate **Model → Section → Diagram** and surface year variants inline on the
  affected parts (labelled by effective date).
- **Colour** is likewise handled inline, not as a navigation step (MVP).

## 3. Architecture at a glance

```
Select Portal page
   │  (scrape, daily/weekly cron)
   ▼
① DATA PIPELINE  ── parses .xls books + PA CSV ──►  Catalog DB
   (new `parts` app: models, ingestion, cron)         (PartsModel, PartSection,
   │                                                    SectionPart, Part, diagrams)
   ▼
② CATALOG API + BROWSE UI
   (DRF read endpoints + Next.js pages: model → section → diagram → add to cart)
   │
   ▼
③ CART + STRIPE CHECKOUT
   (PartsOrder + PartsOrderItem; reuse Stripe PaymentIntent + webhook pattern;
    "email us to confirm" page; no user accounts)
   │
   ▼
④ NOTIFICATIONS
   (reuse notifications app: customer confirmation email, admin email + SMS)
   │
   ▼
⑤ WHOLESALER DISPATCH  (built last)
   (operator-reviewed email to Select Portal: parts list + ship-to address)
```

New Django app: **`parts`** (catalog models, ingestion, ordering models).
`Payment` (in `payments`) gains a nullable `parts_order` link, following the
existing `order` / `hire_booking` pattern. Notifications gain new message types
and send functions. Frontend adds a parts catalog + checkout section under
`frontend/app/parts/`.

## 4. Subsystem specs

| # | Subsystem | Spec file | Depends on |
|---|-----------|-----------|-----------|
| ① | Data pipeline | `2026-07-24-parts-01-data-pipeline-design.md` | — |
| ② | Catalog API + browse UI | `2026-07-24-parts-02-catalog-browse-design.md` | ① |
| ③ | Cart + Stripe checkout | `2026-07-24-parts-03-cart-checkout-design.md` | ②, payments |
| ④ | Notifications | `2026-07-24-parts-04-notifications-design.md` | ③, notifications |
| ⑤ | Wholesaler dispatch | `2026-07-24-parts-05-wholesaler-dispatch-design.md` | ③, ④ |

Each subsystem is specced, planned, and implemented independently, in the order
above. ① is foundational and already de-risked by the extraction spike.

## 5. Cross-cutting decisions

- **Currency / GST:** all prices are AUD incl. GST. The PA `RRP+GST` column is
  the customer price for MVP (no markup applied — revisit before launch;
  see subsystem ① open decisions).
- **No user accounts.** Orders are identified by an `order_reference`; the
  customer is asked to email us from their ordering email for any follow-up.
- **Stock is advisory.** The PA `AVAILABLE` count is a wholesaler snapshot, not a
  live reservation. We display it and block ordering only for parts absent from
  the PA feed. Real fulfilment is confirmed by the wholesaler (subsystem ⑤).
- **Reuse over rebuild:** Stripe flow, `Payment`, `notifications` audit log, SMS,
  and admin dashboard patterns are reused rather than re-implemented.

## 6. Non-goals (MVP)

- No user accounts, saved carts across devices, or order history UI.
- No clickable diagram hotspots (interaction is via the numbered list, like
  easyparts).
- No automated order submission into the wholesaler's system — dispatch is an
  operator-reviewed email (subsystem ⑤).
- No colour/year navigation tiers.
- No returns/RMA workflow.
