# Motorcycle deposits

Motorcycle deposits use `inventory.BikeOrder` and `BK-...` references. They are
separate from product, hire and parts orders.

1. `POST /api/inventory/bike-orders/` checks that the motorcycle is for sale,
   validates the selected colour and terms, snapshots `DepositSettings`, and
   returns a reference plus private access token.
2. Token-protected detail and payment-intent endpoints live under
   `/api/inventory/bike-orders/:reference/`.
3. The signed Stripe webhook records the paid deposit and sends bike-specific
   notifications.

A paid deposit does not currently change `Motorcycle.status`; staff confirm
availability and handle the motorcycle manually. Customer copy must not promise
that the motorcycle has already been reserved.

Admin lists and details live under `/api/inventory/admin/bike-orders/` and the
frontend route `/dashboard/bike-orders`.
