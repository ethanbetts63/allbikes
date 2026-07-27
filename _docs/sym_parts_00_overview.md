# SYM Parts Platform — System Overview & Decomposition

**Date:** 2026-07-24
**Status:** Design / MVP
**Owner:** Ethan

## 1. Purpose

Sell genuine SYM parts on scootershop.com.au via a **drop-ship** model: the
customer orders and pays us; our wholesaler (Select Portal) ships the parts
directly to the customer. The customer experience mirrors the *flow* (not the
look) of easyparts.com; the wholesale data comes from Select Portal's public
parts books and price/availability feed.

The whole system must be **completely automated**: data ingestion, pricing
updates, ordering, payment, and notifications all run without manual data entry.
The only manual step is the operator reviewing each paid order before it is
forwarded to the wholesaler (subsystem ⑤), which also serves as a human check
against wrong-variant orders. But even this in the long term will be automated. 

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
   │  scrape cron  ──►  inbox/ + archive/   (changed/new files only)
   ▼                        │  import cron
① DATA PIPELINE  ── parse .xls books + PA CSV ──►  Catalog DB
   (new `parts` app)     (scrape ≠ import, separated)  (PartsModel, PartSection,
   │  + PartsSettings (markup, shipping fees)           SectionPart, Part, diagrams)
   ▼
② CATALOG API + BROWSE UI
   (DRF read endpoints + Next.js pages: model → section → diagram → add to cart)
   │
   ▼
③ CART + STRIPE CHECKOUT
   (PartsOrder + PartsOrderItem; reuse Stripe PaymentIntent + webhook pattern;
    "email us" page; no user accounts)
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
| ① | Data pipeline | `sym_parts_01_data_pipeline.md` | — |
| ② | Catalog API + browse UI | `sym_parts_02_catalog_browse.md` | ① |
| ③ | Cart + Stripe checkout | `sym_parts_03_cart_checkout.md` | ②, payments |
| ④ | Notifications | `sym_parts_04_notifications.md` | ③, notifications |
| ⑤ | Wholesaler dispatch | `sym_parts_05_wholesaler_dispatch.md` | ③, ④ |

Each subsystem is specced, planned, and implemented independently, in the order
above. ① is foundational and already de-risked by the extraction spike.

## 5. Cross-cutting decisions

- **Pricing = wholesale × markup.** Prices are AUD incl. GST. The customer price
  is the PA feed price × `(1 + markup%)`, where `markup%` is an operator-editable
  setting (`PartsSettings`, subsystem ①). Computed at display/checkout time, never
  stored on the catalog. (Open: whether the PA `RRP+GST` column is our cost or a
  suggested retail — see ①-D1.)
- **Operator settings (`PartsSettings`).** A dashboard settings page (mirroring
  Service/Hire/Deposit settings) holds: `markup_percentage`,
  `domestic_shipping_fee`, `international_shipping_fee`. A singleton with
  `.get()`, like `DepositSettings`.
- **Shipping = flat fee by destination.** Each order gets a flat shipping fee —
  domestic (AU) or international — from `PartsSettings`. Set at checkout (③).
- **Colour = part-number variants, per-callout picker.** Painted body parts are
  colour-suffixed part numbers (e.g. `53205-ALA-000-RD`), each independently
  priced/stocked in the PA feed. They ride the same `SectionPart→Part` variant
  mechanism as year/effective-date variants — no new model. The UI shows a colour
  picker on painted callouts, with human colour names parsed from the paint code
  in the description and the book's `…color index` sheets. No global colour tier.
- **Backorder (advisory stock).** The PA `AVAILABLE` count is a wholesaler
  snapshot, not a live reservation. A part absent from the PA feed is unorderable
  (greyed); a part present but with `AVAILABLE < qty` **can still be ordered** as a
  backorder — real fulfilment is confirmed by the wholesaler (⑤). A fuller
  backorder workflow (customer messaging, partial dispatch) is deferred (see ③).
- **No user accounts.** Orders are identified by an `order_reference`; the
  customer is asked to email us from their ordering email for any follow-up.
- **Reuse over rebuild:** Stripe flow, `Payment`, `notifications` audit log, SMS,
  and admin dashboard/settings patterns are reused rather than re-implemented.

## 6. Non-goals (MVP)

- No user accounts, saved carts across devices, or order history UI.
- No clickable diagram hotspots (interaction is via the numbered list, like
  easyparts).
- No automated order submission into the wholesaler's system — dispatch is an
  operator-reviewed email (subsystem ⑤).
- No colour/year navigation tiers.
- No returns/RMA workflow.
