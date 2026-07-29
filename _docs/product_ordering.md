# Product ordering

E-scooter purchases use `product.ProductOrder` and `PR-...` references.

1. `POST /api/product/orders/` validates the Australian delivery address,
   stock and terms, snapshots the effective product price, and returns the
   reference plus a private access token.
2. `GET /api/product/orders/:reference/` requires the token.
3. `POST /api/product/orders/:reference/payment-intent/` requires the token,
   rechecks stock and charges the snapshotted total.
4. The signed Stripe webhook marks the order paid, records `amount_paid`,
   decrements stock once and sends product-specific notifications.

Admin lists and details live under `/api/product/admin/orders/` and the frontend
route `/dashboard/product-orders`.
