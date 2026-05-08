# Next.js Migration Tasks

Migration from Vite React SPA (served by Django) to Next.js (Vercel) + Django API (Railway).

**Goal:** Server-side rendered HTML for all public pages so Google receives content and meta tags on the first byte, improving crawl speed and Core Web Vitals.

---

## Backend Tasks (Django — Railway)

### 1. Add CORS support
Install `django-cors-headers` and configure it. Currently CORS isn't needed because Django serves the frontend itself. With a separate Vercel domain it is required.

```python
# settings.py
INSTALLED_APPS = [..., 'corsheaders']
MIDDLEWARE = ['corsheaders.middleware.CorsMiddleware', ...]  # must be first

CORS_ALLOWED_ORIGINS = [
    'https://your-app.vercel.app',
    'https://www.scootershop.com.au',
]
CORS_ALLOW_CREDENTIALS = True  # required because we send cookies
```

### 2. Fix auth cookie SameSite setting
`token_views.py` currently sets cookies with `samesite='Lax'`. Lax cookies are **not sent on cross-origin requests**, meaning the auth cookie will be silently dropped when the Vercel frontend calls the Railway API. Must change to `'None'` (which requires `secure=True`).

```python
# token_views.py — _set_auth_cookies()
response.set_cookie(
    ...
    secure=True,       # must always be True when samesite='None'
    samesite='None',   # changed from 'Lax'
)
```

### 3. Update CSRF_TRUSTED_ORIGINS
`settings.py` currently lists `localhost:5173` and `scootershop.com.au`. Add the Vercel deployment URL and Railway app URL when known.

```python
CSRF_TRUSTED_ORIGINS = [
    'https://your-app.vercel.app',
    'https://www.scootershop.com.au',
]
```

### 4. Update ALLOWED_HOSTS
Remove `ethanbetts.pythonanywhere.com`, add Railway app hostname when known.

### 5. Remove frontend-serving config from settings.py
Django no longer serves the React frontend. Remove these lines:

```python
# Remove from TEMPLATES[0]['DIRS']:
os.path.join(BASE_DIR, 'frontend', 'dist')

# Remove from STATICFILES_DIRS:
os.path.join(BASE_DIR, 'frontend', 'dist')
```

### 6. Remove catch-all URL pattern from urls.py
The `TemplateView` catch-all and the trailing-slash redirect for frontend routes are no longer needed. Remove:

```python
# Remove these two lines from allbikes/urls.py:
re_path(r'^(?!api/|admin/|sitemap\.xml)(.+)/$', strip_trailing_slash),
re_path(r'^(?!api/|admin/|sitemap\.xml).*$', TemplateView.as_view(template_name="index.html")),
```

The `strip_trailing_slash` function and `TemplateView` import can also be removed. The Django admin, API routes, and sitemap remain unchanged.

### 7. In-memory cache warning
`settings.py` uses `LocMemCache`. On Railway this is fine with a single dyno, but the cache is per-process and won't be shared across multiple instances. Not an immediate blocker but worth noting for future scaling.

---

## Frontend Tasks (Next.js — Vercel)

### Project Setup

#### 8. Initialise a new Next.js project
Create a new Next.js app using the App Router (not the Pages Router). All existing frontend code moves across — the new project is not a rewrite from zero, it's a restructure.

```bash
npx create-next-app@latest frontend --typescript --tailwind --app
```

Key things to carry over unchanged: all files in `types/`, `utils/`, `lib/`, assets, and all Shadcn UI component files.

#### 9. Replace vite.config.ts with next.config.ts
The Vite dev proxy (`/api` → Django) moves to a Next.js rewrite:

```ts
// next.config.ts
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.DJANGO_API_URL}/api/:path*`,
      },
    ];
  },
};
```

This keeps relative `/api/...` URLs working in development. In production on Vercel, server components will use the absolute `DJANGO_API_URL` env variable directly.

#### 10. Set up environment variables
Two env variables needed:
- `DJANGO_API_URL` — the Railway Django URL (e.g. `https://your-app.railway.app`). Used by server components.
- `NEXT_PUBLIC_API_URL` — same value, but exposed to the browser for client components.

---

### Routing

#### 11. Replace App.tsx + React Router with file-based routing
Every `<Route>` in `App.tsx` becomes a folder and `page.tsx` file inside `app/`. This is mechanical work — the JSX inside each page component doesn't change, just where it lives.

Route mapping:

| React Router | Next.js App Router file |
|---|---|
| `/` | `app/page.tsx` |
| `/service` | `app/service/page.tsx` |
| `/tyre-fitting` | `app/tyre-fitting/page.tsx` |
| `/inventory/motorcycles/new` | `app/inventory/motorcycles/new/page.tsx` |
| `/inventory/motorcycles/used` | `app/inventory/motorcycles/used/page.tsx` |
| `/inventory/motorcycles/parts` | `app/inventory/motorcycles/parts/page.tsx` |
| `/inventory/motorcycles/:slug` | `app/inventory/motorcycles/[slug]/page.tsx` |
| `/escooters` | `app/escooters/page.tsx` |
| `/escooters/:slug` | `app/escooters/[slug]/page.tsx` |
| `/electric-scooters` | `app/electric-scooters/page.tsx` |
| `/service-booking` | `app/service-booking/page.tsx` |
| `/service-booking/confirmation` | `app/service-booking/confirmation/page.tsx` |
| `/contact` | `app/contact/page.tsx` |
| `/terms` | `app/terms/page.tsx` |
| `/privacy` | `app/privacy/page.tsx` |
| `/security` | `app/security/page.tsx` |
| `/refunds` | `app/refunds/page.tsx` |
| `/login` | `app/login/page.tsx` |
| `/hire` | `app/hire/page.tsx` |
| `/hire/book` | `app/hire/book/page.tsx` |
| `/hire/book/:bookingReference/payment` | `app/hire/book/[bookingReference]/payment/page.tsx` |
| `/hire/processing` | `app/hire/processing/page.tsx` |
| `/hire/confirmation/:bookingReference` | `app/hire/confirmation/[bookingReference]/page.tsx` |
| `/checkout/:slug` | `app/checkout/[slug]/page.tsx` |
| `/checkout/:slug/payment` | `app/checkout/[slug]/payment/page.tsx` |
| `/checkout/processing` | `app/checkout/processing/page.tsx` |
| `/checkout/success` | `app/checkout/success/page.tsx` |
| `/checkout/error` | `app/checkout/error/page.tsx` |
| `/dashboard` (nested) | `app/dashboard/layout.tsx` + `app/dashboard/page.tsx` etc. |

The `show_hire` feature flag check (currently `siteSettings.show_hire ? <Outlet /> : <Navigate to="/" />`) moves into the individual hire page files or a hire layout.

#### 12. Create app/layout.tsx (replaces main.tsx)
`main.tsx` and its providers become the root layout. `BrowserRouter` is removed — Next.js handles routing.

```tsx
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <NavBar />
          <main>{children}</main>
          <Footer />
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
```

`ScrollToTop` is removed — Next.js App Router scrolls to top on navigation by default.

---

### React Router Replacements

#### 13. Replace all react-router-dom imports
Every file using React Router needs updating. Quick reference:

| react-router-dom | Next.js equivalent |
|---|---|
| `<Link to="/path">` | `<Link href="/path">` from `next/link` |
| `useNavigate()` → `navigate('/path')` | `useRouter()` → `router.push('/path')` |
| `useParams()` | `params` prop passed to page component |
| `useLocation()` | `usePathname()` / `useSearchParams()` |
| `<Navigate to="/path" replace />` | `redirect('/path')` (server) or `router.replace()` (client) |
| `<Outlet />` | `{children}` in a layout component |

---

### Data Fetching (the core SSR work)

The key change for SEO: public pages move from `useEffect` fetches (client-side, after paint) to `async` server components (server-side, before HTML is sent).

#### 14. Convert HomePage to a server component
Currently fetches featured bikes and products in a `useEffect`. In Next.js:

```tsx
// app/page.tsx — server component (no "use client")
export default async function HomePage() {
  const [newBikes, usedBikes, products] = await Promise.all([
    fetch(`${process.env.DJANGO_API_URL}/api/inventory/bikes/?condition=new&is_featured=true`).then(r => r.json()),
    fetch(`${process.env.DJANGO_API_URL}/api/inventory/bikes/?condition=used&is_featured=true`).then(r => r.json()),
    fetch(`${process.env.DJANGO_API_URL}/api/product/products/?is_featured=true`).then(r => r.json()),
  ]);
  return <HomePageContent newBikes={newBikes.results} ... />;
}
```

The interactive/stateful parts of the homepage (carousel, floating action button) become separate client components.

#### 15. Convert BikeDetailPage to a server component
Currently extracts `id` from slug in a `useEffect`, then fetches. In Next.js:

```tsx
// app/inventory/motorcycles/[slug]/page.tsx
export default async function BikeDetailPage({ params }) {
  const id = params.slug.split('-').pop();
  const bike = await fetch(`${process.env.DJANGO_API_URL}/api/inventory/bikes/${id}/`).then(r => r.json());
  // bike data is available before HTML is sent — Google sees it immediately
  return <BikeDetailContent bike={bike} />;
}
```

Note: the `id`-from-slug pattern (`slug.split('-').pop()`) continues unchanged.

#### 16. Convert BikeListPage to a hybrid component
The initial bike list can be server-rendered. The filter/sort UI is interactive and stays client-side. Split into:
- `app/inventory/motorcycles/new/page.tsx` — server component fetches page 1
- `BikeListClient.tsx` — `"use client"` component handles filter state and subsequent fetches

#### 17. Convert EScooterDetailPage to a server component
Same pattern as BikeDetailPage — extract product ID from slug, fetch server-side.

#### 18. Convert EScooterListPage to a hybrid component
Same pattern as BikeListPage — initial data server-rendered, filter/sort client-side.

#### 19. Convert TermsAndConditionsPage to a server component
Currently fetches terms from `/api/data/terms/latest/` in a useEffect. Simple server-side fetch.

#### 20. Static public pages — no data fetching changes needed
These pages have no API calls and move across with minimal changes (just routing + `"use client"` on any interactive parts):
- `ServicePage`
- `TyreFittingPage`
- `ContactPage`
- `PrivacyPolicyPage`
- `SecurityPolicyPage`
- `RefundsPage`
- `ElectricScootersLandingPage`

#### 21. Interactive/transactional pages — keep as client components
These pages are not indexed by Google and don't benefit from SSR. Keep all data fetching in `useEffect` as-is, just add `"use client"` at the top:
- All checkout pages (`CheckoutPage`, `CheckoutPaymentPage`, `CheckoutProcessingPage`, `CheckoutSuccessPage`, `CheckoutErrorPage`)
- All hire booking pages (`HireBookingPage`, `HirePaymentPage`, `HireProcessingPage`, `HireConfirmationPage`)
- `ServiceBookingPage` and `ServiceBookingConfirmationPage`
- `LoginPage`
- All admin/dashboard pages

---

### SEO / Metadata

#### 22. Remove react-helmet-async and the Seo component
`react-helmet-async` only works client-side. Next.js has a first-class `generateMetadata` API that runs on the server and gets embedded in the HTML `<head>` before it's sent.

The `Seo` component is used in every page. It gets replaced by a `generateMetadata` export in each page file.

Static pages (no dynamic data):

```tsx
// app/service/page.tsx
export const metadata = {
  title: 'Motorcycle & Scooter Servicing Dianella, Perth | ScooterShop',
  description: 'Expert motorcycle and scooter servicing...',
  alternates: { canonical: 'https://www.scootershop.com.au/service' },
  openGraph: { ... },
};
```

Dynamic pages (data-dependent titles and descriptions):

```tsx
// app/inventory/motorcycles/[slug]/page.tsx
export async function generateMetadata({ params }) {
  const id = params.slug.split('-').pop();
  const bike = await fetch(`${process.env.DJANGO_API_URL}/api/inventory/bikes/${id}/`).then(r => r.json());
  return {
    title: `${bike.year} ${bike.make} ${bike.model} | ScooterShop`,
    description: bike.description || `...`,
    alternates: { canonical: `https://www.scootershop.com.au/inventory/motorcycles/${bike.slug}` },
    openGraph: { images: [{ url: bike.images[0]?.image }] },
  };
}
```

The structured data (JSON-LD) from the `Seo` component moves into `<script type="application/ld+json">` tags rendered in each page component directly, which is fine since Next.js renders those server-side too.

#### 23. Add generateStaticParams for dynamic routes
For `BikeDetailPage` and `EScooterDetailPage`, Next.js can pre-generate HTML for all known slugs at build time (`generateStaticParams`). This makes those pages load instantly and is the fastest possible path for Google to crawl them.

```tsx
export async function generateStaticParams() {
  const bikes = await fetch(`${process.env.DJANGO_API_URL}/api/inventory/bikes/?page_size=100`).then(r => r.json());
  return bikes.results.map(bike => ({ slug: bike.slug }));
}
```

---

### Authentication

#### 24. Update AuthContext to work with Next.js
`AuthContext.tsx` uses `window.addEventListener` and `useEffect` — it must be a client component. Add `"use client"` at the top. Logic inside is otherwise unchanged.

#### 25. Protect dashboard routes with Next.js middleware
Currently `AdminLayout.tsx` checks `user?.is_staff` and renders `<Navigate to="/login">` if not authenticated. In Next.js this becomes middleware that runs before the page renders, which is both more efficient and more secure.

```ts
// middleware.ts (project root)
export function middleware(request) {
  const token = request.cookies.get('access_token');
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
```

`AdminLayout.tsx` keeps the sidebar UI but can drop the auth check — middleware handles it. The `adminGetDashboard()` call and badge counts stay as a client-side `useEffect`.

#### 26. Update apiClient.ts for server/client split
`apiClient.ts` reads `document.cookie` for CSRF tokens — this only works in the browser. Server components don't use `authedFetch` at all (they make unauthenticated public API calls). `authedFetch` stays as-is but is only used in `"use client"` components. Add a guard:

```ts
// apiClient.ts
function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;  // server guard
  ...
}
```

#### 27. Update all relative API URLs in api.ts
All `/api/...` paths work in the browser (proxied via Next.js rewrites in dev, direct calls in prod). For server components, absolute URLs are needed. Create a helper:

```ts
// lib/apiUrl.ts
export const apiUrl = (path: string) =>
  typeof window === 'undefined'
    ? `${process.env.DJANGO_API_URL}${path}`
    : path;
```

---

### Components

#### 28. Add "use client" to interactive components
Any component using `useState`, `useEffect`, event handlers, browser APIs, or React Router hooks needs `"use client"` at the top. This is a one-line addition, not a rewrite.

Components that definitely need it:
- `AuthContext.tsx`
- `NavBar.tsx` (mobile menu state)
- `FilterSort.tsx` (filter state)
- `ProductFilterSort.tsx`
- `MediaGallery.tsx` (selected media state)
- `ReviewCarousel.tsx`
- `ScrollToTop.tsx` (actually removed — see item 12)
- `FloatingActionButton.tsx`
- All Shadcn UI components (`button`, `dialog`, `popover`, `calendar`, `select`, etc.)
- All form components in `forms/`
- `BannerV2.tsx`

#### 29. Handle siteSettings
`config/siteSettings.ts` is currently a hardcoded snapshot from a database backup. In Next.js, the root layout could fetch this once server-side and pass it down as props, or it can stay hardcoded (simpler, consistent with the existing approach). Worth deciding before migrating pages that use it.

---

### Deployment

#### 30. Set up Railway for Django
- Connect GitHub repo, configure build command and start command
- Set all existing `.env` variables as Railway environment variables
- Provision a MySQL database in Railway and migrate
- Test all API endpoints

#### 31. Set up Vercel for Next.js
- Connect GitHub repo (can point to `frontend/` subdirectory)
- Set `DJANGO_API_URL` and `NEXT_PUBLIC_API_URL` environment variables
- Confirm preview deployments work on pull requests

#### 32. Update Django ALLOWED_HOSTS and trusted origins with final domains
Once Railway and Vercel URLs are known, update `settings.py` with the real hostnames.

---

## Summary of what does NOT change

- All TypeScript types (`types/` directory) — zero changes
- All CSS and Tailwind configuration including CSS variable system
- The Django API itself — all views, models, serializers, Stripe, Mailgun, MechanicDesk, service logic
- The structured data / JSON-LD built in each page — moves from `Seo` component props to `generateMetadata` but the data shape is identical
- The ID-from-slug pattern (`slug.split('-').pop()`) — continues unchanged
- Shadcn UI component files — unchanged, just need `"use client"` added
