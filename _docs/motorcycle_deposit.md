# Motorcycle deposits

Motorcycle deposits use `inventory.BikeOrder` and `BK-...` references. They are
separate from product, hire and parts orders.

1. `POST /api/inventory/bike-orders/` checks that the motorcycle is for sale,
   validates the selected colour and terms, snapshots `DepositSettings`, and
   returns a reference plus private access token.
2. The frontend stores the token in tab-scoped `sessionStorage`; it never puts
   the token in a checkout URL. Detail reads send it in
   `X-Customer-Access-Token`; payment-intent requests send it in the JSON body.
3. The signed Stripe webhook records the paid deposit, atomically changes a
   `for_sale` motorcycle to `reserved`, and sends bike-specific notifications.

Stronger/manual inventory states such as `sold` and `unavailable` are not
overwritten by the deposit webhook.

Admin lists and details live under `/api/inventory/admin/bike-orders/` and the
frontend route `/dashboard/bike-orders`.
