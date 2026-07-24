# ⑤ Wholesaler Dispatch — Design

**Date:** 2026-07-24 · **Subsystem 5 of 5** · **Depends on:** ③ (PartsOrder), ④ (senders)
**Parent:** `2026-07-24-parts-00-overview-design.md`
**Build order:** LAST — "once everything is perfect" (per the brief).

## 1. Purpose & scope

Get the wholesaler (Select Portal) what they need to drop-ship an order: the exact
parts + quantities and the customer's ship-to address. This is the final,
operator-gated step and the human check against wrong-variant orders.

**In scope:** an **operator-reviewed** action that sends the wholesaler a dispatch
email and marks the order `dispatched`. **Out of scope:** automated submission into
the wholesaler's own ordering system (not available; explicitly a non-goal).

## 2. Design principle: operator-in-the-loop

The brief specifies the wholesaler is emailed "at some point" and that this is done
last. Because there are no accounts and drop-ship mistakes are costly, dispatch is
**not** automatic on payment. Instead the operator reviews each paid order and
triggers the wholesaler email. This is deliberate: it's the verification gate the
"email us from your order email" step feeds into.

## 3. Trigger — admin dashboard action

Add to the existing admin/dashboard (where vehicle orders are managed):
- A **Parts Orders** list (status filter: `paid` / `dispatched`), reusing the
  `admin_order_views` + dashboard patterns already in `payments`/frontend.
- An order detail view showing the itemised lines (with model/section/ref to ease
  wholesaler lookup) and ship-to address.
- A **"Send to wholesaler"** button (operator action, `IsAdminUser`-protected)
  that:
  1. sends the wholesaler dispatch email (§4),
  2. sets `PartsOrder.status='dispatched'`, `dispatched_at=now`,
  3. records a `Message` (`parts_wholesaler_dispatch`).
- Guard: button disabled unless status is `paid`; confirm dialog before sending
  (irreversible outward email). Re-send allowed with an explicit "re-send" confirm.

## 4. Wholesaler dispatch email

New sender `send_parts_wholesaler_dispatch(parts_order)` in
`notifications/utils/email.py`, same structure as the other senders.
- **To:** `WHOLESALER_EMAIL` (new setting/env var; Select Portal orders address).
- **Subject:** `Drop-ship order <order_reference> — <customer suburb/state>`.
- **Body** (`parts_wholesaler_dispatch.html` + text): our reference, the
  **itemised parts list** (part number, description, qty — the fields the
  wholesaler needs), and the **ship-to address** (customer name + full address).
  Include our contact for queries. Deliberately excludes customer pricing (they
  bill us at wholesale).
- Records a `Message` (sent/failed) attached to the `PartsOrder` via
  `content_object`; visible on the messages dashboard.

Uses `parts_wholesaler_dispatch` — the `MESSAGE_TYPE_CHOICES` value reserved in ④.

## 5. Manual-send safety

- Operator-gated + confirm dialog (no accidental sends).
- The dispatch email is the only outbound to a third party; it contains customer
  PII (name + address) strictly necessary for shipping — no payment or pricing
  data.
- `dispatched_at` prevents an order silently sitting unsent (surfaced by the
  extended `send_admin_reminders` from ④ §5).

## 6. Error handling

- Send failure → `Message` recorded `failed`, status stays `paid` (not
  `dispatched`), operator sees the error and can retry. Never mark `dispatched`
  unless the send succeeded.
- Missing `WHOLESALER_EMAIL` config → action disabled with a clear message.

## 7. Testing

- Sender unit test (mock Mailgun): correct recipient (`WHOLESALER_EMAIL`),
  itemised parts + address present, **no pricing** in body, `Message` recorded.
- Admin action test: only `IsAdminUser`; only valid from `paid`; success flips to
  `dispatched` + stamps `dispatched_at` + records message; failure leaves `paid`.
- Reminder integration (if ④ §5 done): `paid` + no `dispatched_at` appears in
  admin reminders.

## 8. Open decisions (for review)

- **W1 — Wholesaler address + format:** confirm the exact email address and
  whether Select Portal wants a specific format/reference (PO number? their SKU
  vs SYM part number — the part numbers match, so likely fine). May need a short
  liaison with them before launch.
- **W2 — Fully manual vs. one-click:** spec is one-click-after-review. If you later
  want it fully automatic on payment, it's a small change (call the sender from the
  webhook instead of the dashboard) — but not recommended for MVP.
- **W3 — Attachments:** plain email vs. a CSV/PDF attachment of the parts list.
  Default: inline table. Add attachment only if the wholesaler requests it.
- **W4 — Backorder/partial:** how to handle the wholesaler reporting a part
  out-of-stock after dispatch email. Out of MVP scope; handled by email
  conversation for now.

## 9. Definition of done

From the admin dashboard, an operator reviews a paid parts order and, with one
confirmed click, emails the wholesaler the parts list + ship-to address; the order
flips to `dispatched` and the send is audit-logged. No third-party email is ever
sent without operator action.
