# SEO Keyword-to-Page Map

Last updated: 2026-05-23

This document maps the main commercial search intents ScooterShop should target to one primary indexable page each. The goal is to avoid making the homepage carry every query, reduce page cannibalization, and use blog content only where the query is informational rather than commercial.

## Current Context

- The homepage receives most organic traffic and has the strongest historical authority.
- Many non-homepage pages are newer, with less accumulated crawl, link, and engagement history.
- Several commercial queries are already near page-one or page-two visibility, so focused page targeting and internal linking may be more useful than broad blog publishing.
- Individual motorcycle/bike detail pages are out of scope for this planning pass.

## Page Ownership Map

| Page | Primary query | Supporting queries | Notes |
|---|---|---|---|
| `/` | `scooter shop perth` | `scooter shop fremantle`, `scooter shop dianella`, `scooter shop near me`, `scooter store perth` | Keep the homepage focused on the local store/brand intent. It should link clearly to the commercial subpages rather than trying to rank for every product and service query. |
| `/inventory/scooters/used` | `used scooters for sale perth` | `second hand scooters perth`, `scooter second hand near me`, `used mopeds perth` | Implemented as a dedicated used scooter listing page with scooter-specific copy, FAQs, schema, sitemap entry, and nav/footer links. |
| `/inventory/motorcycles/used` | `used motorcycles for sale perth` | `second hand motorcycles perth`, `motorcycle dealers perth` | Implemented as a dedicated used motorcycle listing page, filtered separately from scooters and supported by motorcycle-specific copy and FAQs. |
| `/inventory/scooters/new` | `new scooters for sale perth` | `moped for sale perth`, `buy scooter perth`, `125cc scooter for sale`, `50cc scooter for sale` | Implemented as the canonical new scooter listing page. `/inventory/motorcycles/new` redirects here. |
| `/escooters` | `electric scooters perth` or `electric moped perth` | `electric scooter shop perth`, `electric scooters near me`, `e scooter perth`, `electric mopeds` | Implemented as the canonical electric scooter page. `/electric-scooters` redirects here. |
| `/hire` | `motorcycle hire perth` | `moped hire perth`, `moped for rent`, `scooter hire perth`, `motorbike hire perth` | The page is already focused, but should clearly cover each hire/rental wording if those services are offered. |
| `/service` | `scooter service perth` | `scooter repair perth`, `scooter maintenance`, `e scooter service near me` if accurate | Keep this as the general servicing and repair page. It should link to tyre fitting as a more specific service. |
| `/tyre-fitting` | `motorcycle tyre fitting perth` | `motorcycle tyre repair`, `motorcycle tyre fitting near me`, `scooter tyre fitting perth` | Keep this separate. It already has traction and the intent is specific enough to justify its own page. |
| `/contact` | `scooter shop fremantle contact` | `scooter shop open now`, location, address, phone, opening-hours queries | Do not stretch this page into a broad SEO landing page. Improve it for trust, location clarity, and conversion. |

## Completed Changes

### New Scooter Inventory URL

Completed:

- `/inventory/scooters/new` is now the canonical new scooter inventory page.
- `/inventory/motorcycles/new` redirects to `/inventory/scooters/new`.
- Internal navigation, homepage feature links, detail page links, sitemap, and public copy now refer to new scooters rather than new bikes or new motorcycles.

### Used Inventory Split

Completed:

- `/inventory/scooters/used`
- `/inventory/motorcycles/used`

The old mixed used inventory experience has been split by `vehicle_type`. The Django model/API/admin now support motorcycle vs scooter classification, the public listing pages fetch the correct vehicle type, and navigation exposes both used inventory pages.

Each page now has its own:

- Title and meta description
- H1 and intro copy
- FAQ content
- ItemList and FAQ schema
- Sitemap entry
- Internal links from nav/footer/detail pages

### Electric Scooter Consolidation

Completed:

- `/escooters` is now the canonical electric scooter page.
- `/electric-scooters` redirects to `/escooters`.
- The page uses the full electric scooter list instead of a limited featured section.
- Navigation points to `/escooters`.

## Open Recommendations

### Split Service Intent Without Splitting the Main Nav

Google Search Console data for the last 28 days shows `/service` is earning impressions across several service intent zones, especially scooter repair/service and motorcycle mechanic/service terms. The nav should still keep one simple `Servicing` link pointing to `/service`, because most users arriving from the homepage need a general workshop entry point rather than multiple servicing choices.

The better structure is a hub-and-spoke service model:

- `/service` remains the main workshop hub and nav destination.
- `/scooter-repairs` or `/scooter-service`
- `/motorcycle-repairs` or `/motorcycle-service`

These pages should not be thin duplicates. Each should have its own title, H1, examples of work handled, FAQs, booking CTA, schema, and internal links back to `/service`. The purpose is to let Google match specific search intent while keeping the user-facing navigation simple.

They should link to each other where useful, but one should not absorb the other.

## Blog Content Role

Blog posts should support the commercial pages, not compete with them.

## Next Data Needed

The most useful next export from Google Search Console is query-by-page data.

Recommended exports:

- Homepage queries
- `/hire` queries
- `/escooters` queries
- `/service` queries
- `/tyre-fitting` queries
- `/inventory/motorcycles/used` queries
- `/inventory/scooters/used` queries
- New inventory queries

This will show which terms the homepage is currently absorbing and which terms already belong to the newer commercial pages.

## Working Principle

Each important query should have a clear page owner:

- Homepage owns local brand/store intent.
- Inventory pages own for-sale intent.
- Hire page owns rental/hire intent.
- Service page owns repair and maintenance intent.
- Tyre fitting page owns tyre-specific intent.
- Blog posts answer supporting informational questions and pass internal links to the relevant commercial pages.
