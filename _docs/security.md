# Security

This project is split into a mostly static Next.js frontend on Vercel and a Django REST API backend. Public catalogue, content, sitemap, robots, and SEO metadata are served by Next.js. Data, authentication, admin operations, bookings, payments, and webhooks are handled by Django.

## Frontend Boundary

The public site is served from `www.scootershop.com.au`. API requests from the frontend go through the Next.js rewrite in `frontend/next.config.ts`:

```text
/api/:path* -> DJANGO_API_URL/api/:path*/
```

This keeps browser requests on the public frontend origin while Django remains the source of truth for API permissions and data validation.

Dashboard routes are guarded early by `frontend/proxy.ts`, which checks for auth cookies before rendering `/dashboard/:path*`. This is only a routing guard. Django API permissions remain the actual access-control boundary.

Checkout, dashboard, login, payment, processing, confirmation, and other utility routes are marked `noindex` where appropriate. This is SEO hardening, not security.

## Security Headers

The frontend sets baseline browser security headers in `frontend/next.config.ts`:

| Header | Value | Purpose |
|---|---|---|
| `X-Frame-Options` | `DENY` | Prevents the site from being embedded in iframes, reducing clickjacking risk. |
| `X-Content-Type-Options` | `nosniff` | Stops browsers from guessing a different MIME type than the one sent by the server. |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Sends full referrer paths only to same-origin pages; cross-origin requests receive only the origin. |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Denies camera, microphone, and geolocation APIs by default. |

Vercel currently provides HSTS on the public frontend domain:

```text
Strict-Transport-Security: max-age=63072000
```

The Django API also sends `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Cross-Origin-Opener-Policy`, and `Cache-Control: no-store` on API responses.

Content Security Policy is intentionally not enabled yet. Next.js, Stripe, Vercel analytics, inline scripts, images from the API domain, and payment flows all need to be accounted for before a strict CSP is enforced. Add CSP later in report-only mode first, then enforce after testing.

## Authentication

Authentication uses JWT tokens stored in HttpOnly cookies, not localStorage.

| Cookie | Contents | HttpOnly | Secure | Lifetime |
|---|---|---|---|---|
| `access_token` | JWT access token | Yes | Yes in production | 60 minutes |
| `refresh_token` | JWT refresh token | Yes | Yes in production | 30 days |

The custom `CookieJWTAuthentication` class in `data_management/authentication.py` reads the access token from the cookie and authenticates the request. Refresh tokens rotate on use.

Logging out calls `POST /api/token/logout/`, clears auth cookies, and resets client state.

## CSRF

Because authentication uses cookies, state-changing authenticated requests need CSRF protection. Django's `CsrfViewMiddleware` is enabled.

For authenticated frontend requests:

1. Django sets a readable `csrftoken` cookie.
2. `frontend/apiClient.ts` reads that cookie.
3. The client sends it as `X-CSRFToken`.
4. Django verifies the header and cookie match.

Safe HTTP methods do not require the CSRF header. Public stateless endpoints that do not use cookie authentication, such as booking creation and payment intent creation, are `AllowAny` and do not rely on CSRF.

## API Permissions

DRF defaults to authenticated access:

```text
DEFAULT_PERMISSION_CLASSES = IsAuthenticated
```

Public catalogue, public settings, booking creation, order creation, payment intent creation, and webhook endpoints explicitly opt out with `AllowAny` or empty authentication classes where needed.

Admin operations use `IsAdminUser`, including inventory writes, product writes, service settings, hire admin, order admin, and notification admin endpoints.

## Webhooks

Stripe webhooks bypass JWT/session auth and verify Stripe's HMAC signature using `STRIPE_WEBHOOK_SECRET`. Payment success processing is idempotent and uses database transactions/locking where needed.

Mailgun webhooks verify the Mailgun HMAC signature using `MAILGUN_WEBHOOK_SIGNING_KEY`, use constant-time comparison, and reject stale timestamps to reduce replay risk.

## Payment Protections

The frontend never sends trusted prices to the backend. Product and hire pricing is calculated server-side.

Stripe Elements handles card data in Stripe-hosted fields, so card numbers do not touch the Django server.

Stock and payment state updates are processed server-side, with webhook handling designed to avoid duplicate processing from repeated Stripe events.

## Caching

`allbikes.middleware.NoCacheApiMiddleware` sets:

```text
Cache-Control: no-store
```

on `/api/` responses so browsers and intermediaries do not cache API data that may contain user or admin information.

Static frontend pages can still be cached by Vercel, which is expected for the public catalogue and SEO pages.

## Known Issues

`GET /api/payments/orders/{order_reference}/` is public and returns customer order details for the checkout confirmation flow. The reference uses an 8-character random hex suffix and anonymous requests are throttled, so brute force risk is low, but the endpoint still exposes more data than ideal.

Preferred future fix: replace it with a narrow confirmation endpoint or require a short-lived verification token alongside the order reference.

`GET /api/hire/bookings/{booking_reference}/` is also public for payment and confirmation page reloads, but it intentionally returns redacted booking data and does not include customer name, email, or phone.

## Secrets

Secrets are loaded from environment variables and must not be committed. Important variables include:

| Variable | Purpose |
|---|---|
| `SECRET_KEY` | Django signing and cryptographic secret |
| `STRIPE_SECRET_KEY` | Stripe API access |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification |
| `MAILGUN_API_KEY` | Mailgun API access |
| `MAILGUN_WEBHOOK_SIGNING_KEY` | Mailgun webhook verification |
| `ADMIN_EMAIL` | Admin notification recipient |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` | Database connection |
