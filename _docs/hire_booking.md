# Hire booking

Hire uses the independent `hire.HireBooking` model and `HR-...` references.
Rates, discounts, bond and selected extras are snapshotted when the booking is
created.

## Secure customer flow

1. `POST /api/hire/bookings/` validates dates, availability, terms, age and
   extras. It returns the booking reference and a high-entropy access token.
2. The frontend stores the token in tab-scoped `sessionStorage`; it is not put
   in page URLs.
3. `GET /api/hire/bookings/:reference/` requires `X-Booking-Token`.
4. `POST /api/hire/bookings/:reference/payment-intent/` requires the token in
   the JSON body and charges the snapshotted hire total.
5. The signed Stripe webhook changes `pending_payment` to `confirmed` and sends
   hire-specific notifications.

The public summary deliberately excludes customer PII and never returns the
access token. Admin APIs remain protected by staff authentication.
