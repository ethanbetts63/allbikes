# Security

This project is split into a Next.js frontend on Vercel and a Django REST API
backend. Public catalogue, content, sitemap, robots, and SEO metadata are served
by Next.js. Data, authentication, admin operations, bookings, orders, payments,
and webhooks are handled by Django.

## Frontend Boundary

The public site is served from `www.scootershop.com.au`. Browser API requests go
through the Next.js rewrite in `frontend/next.config.ts`:

```text
/api/:path* -> DJANGO_API_URL/api/:path*/
```

This keeps browser requests on the frontend origin while Django remains the
source of truth for permissions and validation.

Dashboard routes are guarded early by `frontend/proxy.ts`, which checks for an
auth cookie before rendering `/dashboard/:path*`. This is only a routing guard;
Django API permissions are the actual access-control boundary.

Checkout, dashboard, login, payment, processing, confirmation, and other utility
routes are marked `noindex` where appropriate. This is SEO hardening, not
security.

## Browser and Transport Security

The frontend sets these baseline headers in `frontend/next.config.ts`:

| Header | Value | Purpose |
|---|---|---|
| `X-Frame-Options` | `DENY` | Prevents iframe embedding and clickjacking. |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME-type guessing. |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limits cross-origin referrer data. |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Disables unused browser capabilities. |

Vercel provides HSTS on the public frontend. In production Django also enables
HSTS for two years including subdomains, secure session/CSRF cookies, and its
forwarded-HTTPS proxy setting. PythonAnywhere's Force HTTPS setting handles the
HTTP-to-HTTPS redirect.

Django API responses also receive its security headers and
`Cache-Control: no-store`. CORS permits credentials only from the configured
frontend and local-development origins.

Content Security Policy is intentionally not enabled yet. Next.js, Stripe,
Vercel analytics, inline scripts, API-hosted images, and payment redirects must
be inventoried before a strict policy is enforced. Introduce CSP in report-only
mode first.

## Staff Authentication

Staff authentication uses JWTs stored in HttpOnly cookies, not localStorage or
response bodies.

| Cookie | Contents | HttpOnly | Production flags | Lifetime |
|---|---|---|---|---|
| `access_token` | JWT access token | Yes | `Secure; SameSite=None` | 60 minutes |
| `refresh_token` | JWT refresh token | Yes | `Secure; SameSite=None` | 30 days |

`CookieJWTAuthentication` in `data_management/authentication.py` reads the
access cookie and authenticates the request. Refresh tokens rotate on use, but
prior refresh tokens are not blacklisted. Logout clears both browser cookies;
there is no server-side JWT revocation list.

## CSRF

Cookie authentication requires CSRF protection for unsafe requests. Django's
`CsrfViewMiddleware` is enabled, and `CookieJWTAuthentication` explicitly runs
Django's CSRF check for requests it authenticates.

For authenticated frontend requests:

1. Django issues a readable `csrftoken` cookie.
2. `frontend/lib/apiClient.ts` reads it.
3. The client sends it as `X-CSRFToken`.
4. Django verifies that the header and cookie match.

Public stateless endpoints, such as order/booking creation and payment-intent
creation, opt out of cookie authentication and do not use CSRF as identity.

## API Permissions and Throttling

DRF defaults to `IsAuthenticated`. Public catalogue, public settings, customer
order/booking creation, token-protected checkout retrieval, payment-intent, and
webhook endpoints explicitly opt into `AllowAny` with cookie authentication
disabled where appropriate.

Admin operations use `IsAdminUser`, including inventory and product writes,
service settings, hire/order administration, and notification administration.

Anonymous and authenticated requests are throttled globally. Login has a
separate `5/minute` throttle. Throttling is defence in depth, not the primary
access-control mechanism.

## Customer Checkout Access

Product orders, bike deposits, parts orders, and hire bookings receive a
high-entropy capability token when created. The public order or booking
reference is not sufficient by itself to read checkout data or start payment.

The frontend stores each token in `sessionStorage`, scoped by flow type and
reference. Tokens are excluded from payment, processing, confirmation, and
Stripe return URLs. This avoids routine disclosure through browser history,
page/access logs, analytics URLs, error breadcrumbs, and referrer headers.

Customer detail GET requests send the token in
`X-Customer-Access-Token`. Payment-intent POST requests send it in the JSON
body. Django matches both the reference and token before returning data or
creating/reusing a payment intent. API responses use `Cache-Control: no-store`.

`sessionStorage` is scoped to a browser tab. Refreshes and same-tab Stripe
redirects retain access, but closing the tab or opening the URL in another tab
does not. This is intentional: checkout tokens are not durable shareable order
links. A future emailed order link should use a separately designed expiring
magic-link token.

## Webhooks

Stripe webhooks bypass JWT/session authentication and verify Stripe's HMAC
signature using `STRIPE_WEBHOOK_SECRET`. Payment processing is idempotent and
uses database transactions and row locking.

Mailgun webhooks verify the Mailgun HMAC signature using
`MAILGUN_WEBHOOK_SIGNING_KEY`, compare signatures in constant time, and reject
timestamps older than five minutes to reduce replay risk.

## Payment Protections

The frontend never supplies trusted prices. Product, bike deposit, hire, and
parts totals are calculated or snapshotted by the backend. Stripe Elements
handles card data in Stripe-hosted fields, so card numbers do not touch Django.

Successful payment state cannot regress after a late failure webhook. Payment
attempts are retained for audit history. Replacing a pending intent requires
Stripe to confirm cancellation first, preventing an uncertain cancellation from
creating a second charge attempt. A successful bike deposit atomically changes
a `for_sale` motorcycle to `reserved`.

Refunds are currently issued in Stripe first and then recorded manually in the
admin. Changing an admin refund status does not move money.

## Caching

`allbikes.middleware.NoCacheApiMiddleware` sets `Cache-Control: no-store` on all
`/api/` responses so browsers and intermediaries do not cache customer or admin
information. Static frontend pages may still be cached by Vercel.

## Known Limitations

- Content Security Policy is not yet enabled.
- Customer checkout capability tokens do not expire server-side. Browser
  storage is session-scoped, but a copied token remains valid. Token headers and
  payment-intent request bodies must be excluded or redacted in monitoring.
- Hire and parts confirmation payloads are intentionally redacted. Product and
  bike confirmation payloads contain customer details needed by their current
  confirmation pages and therefore require the capability token.
- JWT logout clears cookies but does not revoke an already-copied JWT or refresh
  token server-side.

## Secrets

Secrets are loaded from environment variables and must not be committed.
Production startup fails immediately if `SECRET_KEY`, `STRIPE_SECRET_KEY`, or
`STRIPE_WEBHOOK_SECRET` is absent.

| Variable | Purpose |
|---|---|
| `SECRET_KEY` | Django signing, JWT, and cryptographic secret |
| `STRIPE_SECRET_KEY` | Stripe API access |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification |
| `MAILGUN_API_KEY` | Mailgun API access |
| `MAILGUN_WEBHOOK_SIGNING_KEY` | Mailgun webhook verification |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` | SMS provider access |
| `MECHANICDESK_BOOKING_TOKEN` | MechanicDesk booking integration |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` | Database access |
