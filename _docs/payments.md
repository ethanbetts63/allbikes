# Payments

`payments.Payment` is the local record for one Stripe PaymentIntent. A database
constraint requires exactly one target:

- `product.ProductOrder`
- `inventory.BikeOrder`
- `hire.HireBooking`
- `parts.PartsOrder`

There is no generic or mixed `Order` model.

## Intent creation

All four domains call `payments/payment_intents.py`. The helper owns Stripe
creation, retrieval, cancellation, minimum-amount handling and local Payment
creation. Each domain remains responsible for checking eligibility and supplying
its snapshotted amount.

Customer payment endpoints are token-protected. The frontend keeps all four
domains' tokens in tab-scoped `sessionStorage`, sends
`X-Customer-Access-Token` for reads, and sends the token in the JSON body for
payment-intent creation. Tokens are never included in checkout URLs.

## Webhooks

`POST /api/payments/webhook/` verifies the Stripe signature before dispatching
`payment_intent.succeeded` or `payment_intent.payment_failed`.

Successful product payments mark the order paid and decrement stock. Bike
payments mark the deposit paid and change a `for_sale` motorcycle to `reserved`.
Hire payments confirm the booking. Parts payments mark the order paid. Domain
specific customer/admin notifications run after the database transaction.

## Integrity

- Stripe PaymentIntent IDs are unique.
- Every Payment has exactly one explicit domain target.
- Orders/bookings retain every failed, cancelled and successful payment attempt.
- Product prices, bike deposits, hire rates/extras and parts totals are snapshots.
- Admin product/bike `paid` and `refunded` status updates require a Payment row.

The product/bike migration and rationale are documented in
`_docs/product_bike_order_split_plan.md`.
