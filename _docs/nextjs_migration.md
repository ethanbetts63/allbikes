# Next.js Migration — State of Play

This document records everything done during the Vite → Next.js (App Router) migration, decisions made, and what the next engineer needs to know.

---

## Project structure

```
allbikes/
├── allbikes/          Django project (settings, urls, wsgi)
├── frontend/          Next.js 16 app (this is the active frontend)
├── frontend_vite/     Old Vite+React SPA — kept for reference, do not modify
├── _docs/             Documentation
└── requirements.txt   Python deps
```

**Running locally:**
- Django: `python manage.py runserver` (port 8000) — activate venv first
- Next.js: `cd frontend && npm run dev` (port 3000)

Both must run simultaneously. All `/api/*` requests from the browser hit Next.js on 3000, which proxies them to Django on 8000 via the rewrite in `next.config.ts`.

---

## What was migrated (Phase 3 — complete)

The goal of Phase 3 was: get the existing Vite page components running inside the Next.js App Router without rewriting any business logic. The components live in `frontend/pages_vite/` and `frontend/components/` — they are re-exported from `frontend/app/*/page.tsx` files.

### App Router route files created

Every page in `frontend/app/` is a thin wrapper:

```tsx
// typical static page
export { default } from '@/pages_vite/SomePage';

// pages using useSearchParams — need force-dynamic to avoid Suspense error
export const dynamic = 'force-dynamic';
export { default } from '@/pages_vite/SomePage';
```

The `force-dynamic` export was added to these 8 pages:
- `app/checkout/[slug]/page.tsx`
- `app/checkout/error/page.tsx`
- `app/checkout/processing/page.tsx`
- `app/checkout/success/page.tsx`
- `app/hire/page.tsx`
- `app/hire/book/page.tsx`
- `app/hire/processing/page.tsx`
- `app/terms/page.tsx`

Dashboard layout: `app/dashboard/layout.tsx` wraps all dashboard routes in `AdminLayout`.

BikeListPage pages pass a `bikeCondition` prop:
```tsx
// app/inventory/motorcycles/new/page.tsx
import BikeListPage from '@/pages_vite/BikeListPage';
export default function Page() {
  return <BikeListPage bikeCondition="new,demo" />;
}
```

### react-router-dom → next/navigation

Every import of `react-router-dom` was replaced:

| Old | New |
|-----|-----|
| `import { useNavigate } from 'react-router-dom'` | `import { useRouter } from 'next/navigation'` |
| `import { useParams } from 'react-router-dom'` | `import { useParams } from 'next/navigation'` |
| `import { useSearchParams } from 'react-router-dom'` | `import { useSearchParams } from 'next/navigation'` |
| `import { Link } from 'react-router-dom'` | `import Link from 'next/link'` |
| `navigate('/path')` | `router.push('/path')` |
| `<Link to="/path">` | `<Link href="/path">` |

**Key API differences:**
- `useSearchParams()` from react-router returns `[params, setter]` tuple. Next.js returns just `params` directly — no destructuring.
- `useParams<{ id: string }>()` from Next.js returns `Record<string, string | string[]>` — cast with `as { id: string }` or access as `params.id`.
- `router.push(path, { state: {...} })` — **state does not exist** in Next.js router. See "Lost state" section below.

### Lost router state (payment flows)

Several pages previously received data via `location.state` (react-router):
- `CheckoutPaymentPage` — received `clientSecret`, `orderReference`, `itemSummary`
- `HirePaymentPage` — received `clientSecret`, `bookingReference`, `bookingSummary`
- `CheckoutProcessingPage` — received order data
- `HireProcessingPage` — received booking data
- `ServiceBookingConfirmationPage` — received booking form data

**Current behaviour:** Checkout, hire payment, and service confirmation have been moved off lost router state.

**Checkout status: fixed in Phase 4.** `CheckoutPage` now creates the Django order, navigates to `/checkout/[slug]/payment?ref=SS-XXXXXXXX`, and `CheckoutPaymentPage` reloads the order by reference before creating/reusing the Stripe PaymentIntent. Processing/success/error pages already use `ref` query params, so checkout is now refresh/direct-open tolerant.

**Hire payment status: fixed in Phase 4.** `HireBookingPage` now creates the Django hire booking and navigates to `/hire/book/[bookingReference]/payment`. `HirePaymentPage` reads `bookingReference` from the route, reloads the booking from Django, and creates/reuses the Stripe PaymentIntent from `booking.id`. Processing and confirmation already use the booking reference.

**Service confirmation status: fixed in Phase 4.** The service booking flow has no public reference lookup endpoint because the canonical booking is created in MechanicDesk. `ServiceBookingPage` now stores the submitted form snapshot in `sessionStorage` immediately after a successful API response, clears the draft progress, and navigates to `/service-booking/confirmation`. `ServiceBookingConfirmationPage` reads and clears that snapshot for display. This is display-only; Django/MechanicDesk remain the source of truth.

**What needs doing (Phase 4 of payment flow):** Persist the data another way before navigating:
- `sessionStorage` (simplest — set before `router.push`, read on arrival)
- URL query params (good for references/IDs that are short)
- Server-side: store in DB and pass reference in URL

The deposit `checkoutType` was fixed properly: `BikeDetailPage` now navigates to `/checkout/[slug]?type=deposit` and `CheckoutPage` reads it from `useSearchParams()`.

### `"use client"` directive

Every component that uses React hooks or browser APIs must have `"use client"` as the first line. All `pages_vite/` and interactive `components/` files had this added. Server components (default in App Router) cannot use hooks.

### Env vars

| Old (Vite) | New (Next.js) |
|-----------|--------------|
| `import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY` | `process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` |
| `import.meta.env.VITE_*` | `process.env.NEXT_PUBLIC_*` |

`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set in `frontend/.env.local` (copied from root `.env`). The `NEXT_PUBLIC_` prefix is required for vars to be available in the browser bundle.

### `react-helmet-async` → Next metadata

`react-helmet-async` is incompatible with the App Router. Phase 5 has started replacing the old `Seo` props with route-level `metadata` / `generateMetadata` exports.

`components/Seo.tsx` is no longer responsible for titles/meta/canonicals. It only renders JSON-LD scripts from existing `structuredData` props while migrated Vite pages still own the structured-data objects.

### `AdminLayout` rewrite

`pages_vite/admin/AdminLayout.tsx` was fully rewritten. Key changes:
- `NavLink` → `Link` + `usePathname()` for active class
- `Outlet` → `{children}` prop
- `<Navigate />` → `useEffect` with `router.push('/login')`

### `StaticImageData` — all `.webp`/`.png` imports

In Next.js, importing `.webp`, `.png`, `.jpg` returns a `StaticImageData` object `{ src, width, height }`, not a URL string. Every place these were used directly as `img src` or `srcSet` had `.src` appended.

Files fixed:
- `components/BrandsSection.tsx`
- `components/EScooterMopedsSection.tsx`
- `components/HomeHeroV2.tsx`
- `components/MotorcycleMovers.tsx`
- `components/NavBar.tsx`
- `pages_vite/BikeListPage.tsx`
- `pages_vite/ContactPage.tsx`
- `pages_vite/EScooterListPage.tsx`
- `pages_vite/RefundsPage.tsx`

`.svg` imports are typed as `any` in Next.js (see `node_modules/next/image-types/global.d.ts`). At runtime they return a URL string — do NOT add `.src` to SVG imports.

### react-day-picker v10 API changes

`components/ui/calendar.tsx` (shadcn) was generated against an older API:
- `table` classname key → `month_grid` (renamed in v10)
- `initialFocus` prop removed — deleted from `forms/ServiceBookingDetailsForm.tsx`

### `localStorage` SSR guard

`pages_vite/ServiceBookingPage.tsx` reads `localStorage` in a `useState` lazy initializer. Added `typeof window === 'undefined'` guard so it doesn't throw during SSR.

### Copied files from `frontend_vite/src/`

These files were missing from `frontend/` and were copied from the old Vite project:
- `frontend/api.ts` — all API functions
- `frontend/apiClient.ts` — `authedFetch` wrapper with CSRF/JWT handling

---

## API proxy setup

`frontend/next.config.ts`:
```ts
skipTrailingSlashRedirect: true,  // prevents redirect loop with Django APPEND_SLASH
async rewrites() {
  return [{ source: "/api/:path*", destination: "http://localhost:8000/api/:path*" }];
}
```

**Why `skipTrailingSlashRedirect`:** Next.js by default redirects URLs *with* trailing slashes to remove them. Django's `APPEND_SLASH=True` does the opposite. The combination creates an infinite loop (`ERR_TOO_MANY_REDIRECTS` in the browser). This flag disables Next.js's normalisation entirely.

In production on Vercel, set `DJANGO_API_URL` in the Vercel environment variables to the PythonAnywhere URL.

---

## Environment variables

### `frontend/.env.local` (local dev only, not committed)
```
DJANGO_API_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Root `.env` (Django)
Contains `SECRET_KEY`, `DB_*`, `STRIPE_SECRET_KEY`, `MAILGUN_*`, etc. The `VITE_STRIPE_PUBLISHABLE_KEY` in this file is the old Vite key — its value was copied to `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in `.env.local`.

---

## Current known issues

### `[object%20Object]` 404 in devtools

There is an unresolved 404 for a URL literally named `[object%20Object]`. This means somewhere a JavaScript object is being passed as an `img src` or `fetch()` URL instead of a string. To diagnose:

1. Open browser devtools → Network tab → filter by `[object`
2. Click the request → check the Initiator tab to find the exact file and line
3. The most likely cause is a `.webp`/`.png` `StaticImageData` that was missed in the `.src` pass

### Payment/hire flows redirect back to start

See "Lost router state" above. This is intentional for now — not a bug introduced by the migration, just a missing Phase 4 implementation.

---

## What still needs doing

### Phase 4 — Payment flow state
Fix the broken checkout / hire / service confirmation flows. The state was lost in the router migration. Use `sessionStorage` as the bridge:

```ts
// before navigating
sessionStorage.setItem('checkoutState', JSON.stringify({ clientSecret, orderReference, itemSummary }));
router.push('/checkout/payment');

// on arrival
const raw = sessionStorage.getItem('checkoutState');
const state = raw ? JSON.parse(raw) : null;
sessionStorage.removeItem('checkoutState'); // clear after reading
```

Phase 4 state bridge status:
- `CheckoutPage` → `CheckoutPaymentPage`: fixed with order reference in URL.
- `HireBookingPage` → `HirePaymentPage`: fixed with booking reference route param.
- `HireProcessingPage` → `HireConfirmationPage`: already reference-based.
- `ServiceBookingPage` → `ServiceBookingConfirmationPage`: fixed with display-only `sessionStorage` snapshot.

### Phase 5 — SEO server components + generateMetadata
Status: partially complete.

Added `frontend/lib/seo.ts` with shared metadata helpers and canonical URL handling.

Completed route metadata:
- `/`
- `/inventory/motorcycles/new`
- `/inventory/motorcycles/used`
- `/inventory/motorcycles/parts`
- `/inventory/motorcycles/[slug]` via `generateMetadata`
- `/escooters`
- `/escooters/[slug]` via `generateMetadata`
- `/electric-scooters`
- `/contact`
- `/service`
- `/tyre-fitting`
- `/hire`
- `/service-booking`
- `/refunds`
- `/privacy`
- `/security`
- `/terms`

Completed noindex route metadata:
- `/checkout/[slug]`
- `/checkout/[slug]/payment`
- `/checkout/processing`
- `/checkout/success`
- `/checkout/error`
- `/hire/book`
- `/hire/book/[bookingReference]/payment`
- `/hire/processing`
- `/hire/confirmation/[bookingReference]`
- `/service-booking/confirmation`
- `/login`
- `/dashboard/:path*` via `app/dashboard/layout.tsx`

Still to consider:
- Decide whether to move selected public pages from client fetching to async server components. Current Phase 5 only fixes metadata and JSON-LD while leaving migrated page rendering intact.

### Phase 6 — Auth middleware
Status: complete.

`frontend/proxy.ts` now protects `/dashboard/:path*` before the dashboard page renders. Next.js 16 renamed the old `middleware.ts` convention to `proxy.ts`, so this uses the current file convention. It checks for either `access_token` or `refresh_token`; the refresh cookie is accepted because `AuthProvider`/`authedFetch` can refresh an expired access token client-side. Unauthenticated users are redirected to `/login?next=/dashboard/...`.

`LoginForm` now honors the `next` param when it points at a dashboard route, otherwise it falls back to `/dashboard/inventory`. `AdminLayout` still keeps its client-side staff check as a second layer, because the middleware only proves that an auth cookie exists; staff authorization still comes from `/api/data/me/`.

### Targeted lint cleanup
Status: started.

Correctness-grade lint fixed:
- Cleared all `react-hooks/rules-of-hooks` errors. The only hook-order violation was in `components/FeaturedBikes.tsx`, where an early `return null` ran before hooks. Hooks now run unconditionally and the scrolling effect exits early when there are no bikes.

Still noisy:
- `react-hooks/set-state-in-effect` warnings/errors from migrated Vite patterns.
- `react-hooks/exhaustive-deps` warnings that need case-by-case review.
- `@typescript-eslint/no-explicit-any` in older form/admin types.
- `react/no-unescaped-entities` copy-only issues.
- `@next/next/no-img-element` image optimization warnings.

### Phase 7 — CSR to SSR migration
Status: started.

Goal: move SEO-critical public pages away from Vite-style client-side fetching and toward Next.js server rendering. The current app has real route metadata, but much of the visible page content still loads after hydration via `useEffect`. The target is: server route fetches Django data, sends HTML with real content, and keeps client components only for interactivity.

Migration strategy:
- Start with the homepage because it has high SEO value and already fetches only three simple public datasets.
- Use App Router server pages as data loaders. Fetch from Django on the server, then pass serializable initial data into existing client components.
- Keep existing client components initially. Do not rewrite carousels, forms, filters, or animations during the first SSR pass.
- Keep browser-side fallback fetching only where it materially improves resilience after hydration.
- Once a route has initial server data working, optionally split it into a server shell plus smaller client-only widgets.

Recommended conversion order:
1. `/` homepage: featured new bikes, featured used bikes, featured e-scooters. **Done:** `app/page.tsx` now fetches these datasets on the server and passes them into `pages_vite/HomePage` as initial props. The route revalidates every 5 minutes.
2. `/inventory/motorcycles/new`, `/used`, `/parts`: first page of list data server-rendered; filters can remain client-side. **Done:** these routes now fetch page 1 on the server, pass `initialBikes` / `initialTotalPages` into `BikeListPage`, and revalidate every 5 minutes.
3. `/escooters`: first page of product list server-rendered; filters can remain client-side. **Done:** this route now fetches page 1 on the server, passes `initialProducts` / `initialTotalPages` into `EScooterListPage`, and revalidates every 5 minutes.
4. `/inventory/motorcycles/[slug]` and `/escooters/[slug]`: detail data server-rendered and passed into current detail components. **Primary detail data done:** these routes now fetch the bike/product on the server and pass it as `initialBike` / `initialProduct`. Detail components still keep browser fallback fetching, and bike detail still fetches related carousel/deposit data after hydration.
5. Static content pages (`/service`, `/tyre-fitting`, `/contact`, `/electric-scooters`) only need smaller cleanup because they are mostly static already.

Do not SSR:
- Dashboard/admin pages.
- Checkout/payment/processing/success/error pages.
- Hire booking/payment flow pages.
- Service booking form.
- Login page.

Acceptance criteria for each converted public page:
- Initial HTML contains meaningful page content without waiting for browser API calls.
- Page still works if client JavaScript hydrates normally.
- Existing interactive behavior remains unchanged.
- Django API failures produce a usable fallback page instead of a blank page.
- `npm run build` and `npx tsc --noEmit` pass.

### Phase 8 — Deploy to Vercel
1. Push `frontend/` to a GitHub repo (or the root monorepo)
2. Create a Vercel project pointed at `frontend/` as the root directory
3. Add env vars in Vercel dashboard: `DJANGO_API_URL`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
4. Update `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS` in Django settings to include the Vercel deployment URL
5. PythonAnywhere: ensure CORS allows requests from the Vercel domain

---

## File map

| Concern | Location |
|---------|----------|
| App Router pages | `frontend/app/*/page.tsx` |
| Page components (business logic) | `frontend/pages_vite/` |
| Shared components | `frontend/components/` |
| Forms | `frontend/forms/` |
| API client | `frontend/api.ts`, `frontend/apiClient.ts` |
| Auth context | `frontend/context/AuthContext.tsx` |
| Type definitions | `frontend/types/` |
| Static config (hours, contact info) | `frontend/config/siteSettings.ts` |
| Static assets (images, SVGs) | `frontend/assets/` |
| Global CSS + CSS variables | `frontend/app/globals.css`, `frontend/src/index.css` |
| Tailwind config | `frontend/tailwind.config.ts` |
| Next.js config | `frontend/next.config.ts` |
| TypeScript config | `frontend/tsconfig.json` |
| Django project config | `allbikes/settings.py`, `allbikes/urls.py` |
