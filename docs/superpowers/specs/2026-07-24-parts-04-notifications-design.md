# ④ Notifications — Design

**Date:** 2026-07-24 · **Subsystem 4 of 5** · **Depends on:** ③ (PartsOrder), `notifications`
**Parent:** `2026-07-24-parts-00-overview-design.md`

## 1. Purpose & scope

On a paid parts order, send the customer a confirmation email and the operator an
admin email **and** SMS with full order detail. Reuses the `notifications` app
wholesale (Mailgun email, Twilio SMS, `Message` audit log). The wholesaler email
is a separate subsystem (⑤) built last.

**In scope:** customer confirmation email, admin new-order email, admin SMS, and
their `Message` audit records + templates. **Out of scope:** wholesaler email (⑤).

## 2. Reuse of existing patterns

The existing `notifications/utils/email.py` already implements exactly this shape
for vehicle orders (`send_customer_confirmation`, `send_admin_new_order` +
`_send_admin_sms(sms_messages.admin_new_order(order))`) with `Message` audit rows
via `_record(...)`. Parts notifications add sibling functions following the same
structure — no new infrastructure.

### 2.1 New `Message.MESSAGE_TYPE_CHOICES`
Add: `parts_customer_confirmation`, `parts_admin_new_order`
(and `parts_wholesaler_dispatch`, reserved for ⑤). One migration
(the model already has migrations `0004`–`0007` altering this field).

The `Message.content_object` GenericForeignKey attaches these to the `PartsOrder`
(so the admin messages dashboard at `/dashboard/messages` shows them like the
rest).

## 3. New senders (`notifications/utils/email.py`)

### 3.1 `send_parts_customer_confirmation(parts_order)`
- To: `parts_order.customer_email`.
- Subject: `Order confirmed — <order_reference>`.
- Body (text + HTML template `notifications/emails/parts_customer_confirmation.html`):
  greeting, reference, **itemised line list** (part number, description, qty, unit
  price, line total), subtotal/shipping/total, ship-to address, and the
  **"email us from your order email to confirm"** instruction (mirrors the success
  page from ③ §4.4). Records a `Message` (sent/failed) via `_record`.

### 3.2 `send_parts_admin_new_order(parts_order)`
- To: `_admin_recipients()` (existing `ADMIN_EMAILS` handling).
- Subject: `New parts order — <order_reference>`.
- Body (`parts_admin_new_order.html`): timestamp (AWST, matching existing format),
  **full itemised list incl. model/section/ref for each line** (so the operator
  can look each part up in the wholesaler system), totals, and full customer +
  ship-to details. This email is the operator's working copy for the manual
  wholesaler-forward step (⑤). Records `Message` per recipient.
- Then `_send_admin_sms(sms_messages.admin_new_parts_order(parts_order))`.

### 3.3 `sms_messages.admin_new_parts_order(parts_order)`
New function in `notifications/utils/sms_messages.py`, same style as
`admin_new_order`. Concise (SMS-length): reference, item count, total, customer
name + phone. Example:
`"New parts order: SP-1A2B3C4D — 5 items — $148.20. Customer: Jane Smith 0400…"`.

## 4. Trigger point

Called from the extended webhook (③ §4.3) after the `PartsOrder` is marked `paid`,
**outside** the DB transaction (matching how the vehicle flow calls
`send_customer_confirmation` / `send_admin_new_order` post-commit). Send failures
are logged + recorded as `failed` Messages but never roll back the paid order.

## 5. Admin reminders (optional, reuse)

`send_admin_reminders` currently nags about `paid` vehicle orders not yet
dispatched. Extend it (or add a sibling) to include `PartsOrder`s in `paid` status
with no `dispatched_at`, so unforwarded parts orders surface on the existing
weekly cron. Low priority — can defer to after ⑤.

## 6. Error handling

- Missing customer email → skip customer email, log (shouldn't happen; required at
  checkout).
- No `ADMIN_EMAILS` configured → skip admin email with a warning (existing
  behaviour).
- Mailgun/Twilio failure → caught per-recipient, recorded as `failed`, order
  unaffected. `DEBUG` mode skips real SMS (existing `_send_admin_sms` guard).

## 7. Testing

- Sender unit tests (mock Mailgun/Twilio, as existing `test_email.py` does):
  correct recipients, subject, itemised body content, `Message` rows written with
  the right `message_type` + `content_object`, failure path records `failed`.
- SMS copy test: `admin_new_parts_order` includes reference, count, total.
- Webhook integration (from ③) asserts both senders fire once on `paid` and are
  idempotent on webhook replay.
- `send_test_email` command: extend to preview the two parts templates with dummy
  order data (matches existing `--template` previews).

## 8. Open decisions (for review)

- **N1 — Customer copy:** exact wording of the "email us to confirm" instruction
  and whether the customer email should also restate delivery expectations /
  lead time (drop-ship from wholesaler may be slower than in-stock). Recommend a
  generic "typically ships within X business days" line — value TBD.
- **N2 — Admin SMS threshold:** always SMS, or only above an order value? Default:
  always (consistent with vehicle orders).
- **N3 — Reminders:** include parts orders in `send_admin_reminders` now or after
  ⑤? Default: after ⑤ (so "dispatched" state exists first).

## 9. Definition of done

A paid parts order sends: (1) a customer confirmation email with itemised details
and the email-us instruction, (2) an admin email with full operator detail, and
(3) an admin SMS — all recorded in the `Message` audit log and visible on the
messages dashboard, following the existing vehicle-order patterns exactly.
