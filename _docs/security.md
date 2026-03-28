# Security

This document covers every security mechanism in the project — authentication, authorisation, CSRF, webhook verification, rate limiting, and open issues.

---

## Authentication

### Mechanism

Authentication uses JWT tokens stored as **HttpOnly cookies**, not localStorage.

When a user logs in, the server sets two cookies:

| Cookie | Contents | HttpOnly | Secure | SameSite | Lifetime |
|---|---|---|---|---|---|
| `access_token` | JWT access token | Yes | Yes (prod) | Lax | 60 minutes |
| `refresh_token` | JWT refresh token | Yes | Yes (prod) | Lax | 30 days |

`HttpOnly` means JavaScript cannot read these cookies. An XSS attack that runs arbitrary JS on the page cannot steal them.

`Secure` is `True` in production (HTTPS only), `False` in local development (HTTP).

`SameSite=Lax` allows the cookies to be sent on top-level navigations (e.g. following a link to the site) but not on cross-origin sub-resource requests (e.g. images or XHR from another domain). This provides baseline CSRF protection on top of the explicit token check described below.

### Token refresh

When the frontend makes an authenticated request and receives a `401`, `apiClient.ts` automatically POSTs to `/api/token/refresh/`. The refresh token cookie is sent automatically by the browser — no token is read or written by JavaScript. If the refresh succeeds, the original request is retried. If it fails, an `auth-failure` event is dispatched and the user is logged out.

Refresh tokens rotate on use (`ROTATE_REFRESH_TOKENS = True`).

### Logout

`POST /api/token/logout/` clears both cookies via `response.delete_cookie()`. The client state is also cleared. The call is best-effort — if it fails, the client state still resets.

### Custom authentication class

`data_management/authentication.py` — `CookieJWTAuthentication` extends SimpleJWT's `JWTAuthentication`. It reads the token from the `access_token` cookie instead of the `Authorization` header, then calls `_enforce_csrf()` before returning the user. This ensures every authenticated request — not just form submissions — is CSRF-checked.

---

## CSRF Protection

### Why it's needed

Cookies are sent automatically by the browser on every request to the domain, including requests initiated by malicious third-party pages. Without CSRF protection, an attacker could trick a logged-in admin into unknowingly triggering a state-changing API call.

### How it works

Django's `CsrfViewMiddleware` is active. For every authenticated request made by `authedFetch` in `apiClient.ts`:

1. The browser holds a `csrftoken` cookie (set by Django on login, **not** HttpOnly — JavaScript must be able to read it).
2. `apiClient.ts` reads this cookie and attaches its value as the `X-CSRFToken` request header.
3. Django's middleware verifies the header matches the cookie.

Safe HTTP methods (`GET`, `HEAD`, `OPTIONS`, `TRACE`) do not require the CSRF header.

`_enforce_csrf()` is called inside `CookieJWTAuthentication.authenticate()`, so authentication and CSRF enforcement happen together. A request with a valid access cookie but no CSRF token will be rejected with `403`.

### Unauthenticated endpoints

Public endpoints (e.g. booking creation, order creation, payment intent creation) are `AllowAny` and do not require CSRF — they are not cookie-authenticated, so CSRF does not apply. The webhook endpoints explicitly set `authentication_classes = []` to bypass authentication entirely and rely on signature verification instead.

### Testing CSRF manually

The Django test client bypasses CSRF checks unconditionally (`request._dont_enforce_csrf_checks = True`). To verify CSRF enforcement is working in a real environment:

1. Log in via the UI and confirm the `csrftoken`, `access_token`, and `refresh_token` cookies appear in browser devtools.
2. Using a tool like Postman or curl, make an authenticated write request (e.g. `PATCH /api/inventory/bikes/1/`) with the `access_token` cookie but **without** the `X-CSRFToken` header — expect `403`.
3. Repeat with the correct `X-CSRFToken` header — expect `200`.

---

## Authorisation

### Default permission

DRF's `DEFAULT_PERMISSION_CLASSES` is set to `IsAuthenticated`. Every endpoint requires authentication unless explicitly overridden.

### Endpoint permission levels

| Endpoint group | Permission | Notes |
|---|---|---|
| `GET /api/inventory/bikes/` | `AllowAny` | Public product catalogue |
| `POST/PUT/PATCH/DELETE /api/inventory/bikes/` | `IsAdminUser` | Admin only |
| `GET /api/product/products/` | `AllowAny` | Public; inactive products filtered for non-staff |
| `POST/PUT/PATCH/DELETE /api/product/products/` | `IsAdminUser` | Admin only |
| `POST /api/service/create-booking/` | `AllowAny` | Public booking form |
| `GET /api/service/job-types/` | `AllowAny` | Public |
| `GET /api/service/unavailable-days/` | `AllowAny` | Public |
| `GET /api/service/settings/` | `AllowAny` | Public |
| `GET/PUT/PATCH /api/service/service-settings/` | `IsAdminUser` | Admin only |
| `* /api/service/admin/job-types/` | `IsAdminUser` | Admin only |
| `GET /api/service/admin/booking-logs/` | `IsAdminUser` | Admin only |
| `GET/DELETE /api/service/admin/booking-logs/{id}/` | `IsAdminUser` | Admin only |
| `GET /api/data/me/` | `IsAuthenticated` | Authenticated user |
| `GET /api/data/terms/latest/` | `AllowAny` | Public |
| `POST /api/payments/orders/` | `AllowAny` | Public order creation |
| `GET /api/payments/orders/{ref}/` | `AllowAny` | See Known Issues |
| `POST /api/payments/create-payment-intent/` | `AllowAny` | Public |
| `POST /api/payments/webhook/` | `AllowAny` + signature | Stripe only |
| `GET /api/payments/admin/orders/` | `IsAdminUser` | Admin only |
| `GET /api/payments/admin/orders/{id}/` | `IsAdminUser` | Admin only |
| `PATCH /api/payments/admin/orders/{id}/status/` | `IsAdminUser` | Admin only |
| `GET /api/notifications/messages/` | `IsAdminUser` | Admin only |
| `GET /api/notifications/messages/{id}/` | `IsAdminUser` | Admin only |
| `POST /api/notifications/webhooks/mailgun/` | `AllowAny` + signature | Mailgun only |
| `POST /api/token/` | `AllowAny` | Login |
| `POST /api/token/refresh/` | `AllowAny` | Token refresh |
| `POST /api/token/logout/` | `AllowAny` | Logout |
| `GET /api/hire/bikes/` | `AllowAny` | Public hire fleet listing |
| `GET /api/hire/settings/` | `AllowAny` | Public hire settings (bond, advance days) |
| `GET /api/hire/availability/` | `AllowAny` | Public availability check |
| `POST /api/hire/bookings/` | `AllowAny` | Create hire booking |
| `GET /api/hire/bookings/<reference>/` | `AllowAny` | See Known Issues |
| `POST /api/hire/create-payment-intent/` | `AllowAny` | Create Stripe PaymentIntent for hire |
| `GET /api/hire/admin/settings/` | `IsAdminUser` | Retrieve hire settings |
| `PATCH /api/hire/admin/settings/` | `IsAdminUser` | Update hire settings |
| `GET /api/hire/admin/bookings/` | `IsAdminUser` | List hire bookings |
| `GET /api/hire/admin/bookings/<pk>/` | `IsAdminUser` | Retrieve hire booking |
| `DELETE /api/hire/admin/bookings/<pk>/` | `IsAdminUser` | Delete hire booking |
| `PATCH /api/hire/admin/bookings/<pk>/status/` | `IsAdminUser` | Update booking status/notes |

---

## Webhook Security

### Stripe (`POST /api/payments/webhook/`)

- `authentication_classes = []` — bypasses JWT/session auth entirely (Stripe cannot send cookies)
- Stripe's HMAC signature is verified using `stripe.Webhook.construct_event()` with `STRIPE_WEBHOOK_SECRET`
- Requests with an invalid or missing signature return `400` immediately
- The handler is idempotent — if a `payment_intent.succeeded` webhook arrives twice for the same intent, the second is a no-op

### Mailgun (`POST /api/notifications/webhooks/mailgun/`)

- HMAC-SHA256 signature verified using `MAILGUN_WEBHOOK_SIGNING_KEY`
- `hmac.compare_digest()` used for constant-time comparison (prevents timing attacks)
- Timestamp validation: webhooks older than 5 minutes are rejected (`MAX_TIMESTAMP_AGE_SECONDS = 300`) — prevents replay attacks

---

## Rate Limiting

DRF throttling is configured globally, with a tighter burst limit on the login endpoint:

| Scope | Limit | Applied to |
|---|---|---|
| Anonymous | 250 requests/day | All public endpoints |
| Authenticated | 10,000 requests/day | All authenticated endpoints |
| Login | 5 requests/minute | `POST /api/token/` only |

The `login` scope uses a custom `LoginRateThrottle` (`data_management/throttling.py`) that extends `AnonRateThrottle`. The per-minute limit prevents burst brute-force attempts against the admin login endpoint while leaving all other endpoints unaffected.

---

## Payment Security

- **Price set server-side**: The payment amount is calculated from the product's price in the database. The frontend never sends a price — it cannot be tampered with.
- **Two-stage stock check**: Stock is checked at order creation and again at payment intent creation. The actual decrement happens atomically in the Stripe webhook handler using an `F()` expression with a `stock_quantity__gt=0` guard, preventing stock going below zero under concurrent orders.
- **Atomic payment processing**: `handle_payment_intent_succeeded` runs inside `transaction.atomic()` with `select_for_update()` on the payment row. This prevents duplicate webhook delivery from processing the same payment twice.
- **Card data never touches the server**: Stripe Elements handles card input in an iframe. The server only ever receives a `PaymentIntent` ID.

---

## API Response Caching

`NoCacheApiMiddleware` sets `Cache-Control: no-store` on every `/api/` response. This prevents browsers and intermediary proxies from caching API responses that may contain user data.

---

## Known Issues

### Order retrieval exposes PII without authentication

`GET /api/payments/orders/{order_reference}/` is `AllowAny`. It returns full customer PII (name, email, phone, full address). This endpoint exists to power the post-checkout confirmation page.

The reference format is `SS-` + 8 random hex characters (~4 billion combinations). Brute forcing against the 250/day anonymous rate limit would take tens of thousands of years. The practical risk is low but the design is not ideal.

**Planned fix**: pass order data through from the checkout page without making an API call, eliminating the public lookup endpoint.

### Hire booking retrieval exposes PII without authentication

`GET /api/hire/bookings/{booking_reference}/` is `AllowAny`. It returns customer PII (name, email, phone) and booking details. This endpoint exists to power the hire confirmation page on refresh (when router state is lost).

Same reference design as orders: `HR-` + 8 random hex characters (~4 billion combinations). The practical brute force risk is the same — negligible against the 250/day rate limit.

**Planned fix**: same approach as orders — pass booking data through router state from the payment page, eliminating the need for a public lookup on the confirmation page.

### `authentication_classes = []` on public hire views

Public hire views (`HireBookingCreateView`, `HireBookingRetrieveView`, `HireCreatePaymentIntentView`) set `authentication_classes = []`. This is intentional for the same reason as the payment views — Django REST Framework's default `SessionAuthentication` would enforce CSRF checks when a session cookie is present (e.g. an admin browsing in the same browser tab). These endpoints are stateless and carry no cookie-based auth, so opting out of authentication entirely is correct.

---

## Environment Variables

All secrets are loaded from `.env` via `python-dotenv` and are never committed to the repository.

| Variable | Purpose |
|---|---|
| `SECRET_KEY` | Django secret key (CSRF tokens, session signing) |
| `STRIPE_SECRET_KEY` | Stripe API key for creating payment intents |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature verification |
| `MAILGUN_API_KEY` | Mailgun API key for sending email |
| `MAILGUN_WEBHOOK_SIGNING_KEY` | Mailgun webhook signature verification |
| `ADMIN_EMAIL` | Destination for admin notification emails |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` | Database credentials |
