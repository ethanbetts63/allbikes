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
| `/inventory/scooters/used` | `used scooters for sale perth` | `second hand scooters perth`, `scooter second hand near me`, `used mopeds perth` | Recommended new split. This gives used scooter and moped searches a dedicated landing/listing page instead of mixing them with motorcycles. |
| `/inventory/motorcycles/used` | `used motorcycles for sale perth` | `second hand motorcycles perth`, `motorcycle dealers perth` | Keep this page focused on used motorcycles. If it also displays scooters, the search intent becomes less clear. |
| `/inventory/scooters/new` | `new scooters for sale perth` | `moped for sale perth`, `buy scooter perth`, `125cc scooter for sale`, `50cc scooter for sale` | Recommended long-term URL if new inventory is scooters only. The current `/inventory/motorcycles/new` URL is semantically weaker for scooter searches. |
| `/electric-scooters` | `electric scooters perth` or `electric moped perth` | `electric scooter shop perth`, `electric scooters near me`, `e scooter perth`, `electric mopeds` | Use one canonical electric scooter page. Do not keep `/electric-scooters` and `/escooters` as separate SEO targets unless their intents are genuinely different. |
| `/hire` | `motorcycle hire perth` | `moped hire perth`, `moped for rent`, `scooter hire perth`, `motorbike hire perth` | The page is already focused, but should clearly cover each hire/rental wording if those services are offered. |
| `/service` | `scooter service perth` | `scooter repair perth`, `scooter maintenance`, `e scooter service near me` if accurate | Keep this as the general servicing and repair page. It should link to tyre fitting as a more specific service. |
| `/tyre-fitting` | `motorcycle tyre fitting perth` | `motorcycle tyre repair`, `motorcycle tyre fitting near me`, `scooter tyre fitting perth` | Keep this separate. It already has traction and the intent is specific enough to justify its own page. |
| `/contact` | `scooter shop fremantle contact` | `scooter shop open now`, location, address, phone, opening-hours queries | Do not stretch this page into a broad SEO landing page. Improve it for trust, location clarity, and conversion. |

## Structural Recommendations

### Split Used Inventory by Vehicle Type

Create or strengthen:

- `/inventory/scooters/used`
- `/inventory/motorcycles/used`

The current used inventory experience mixes scooters and motorcycles. Splitting the URLs gives Google clearer page intent and lets each page target a different commercial query set.

### Improve New Scooter Inventory Semantics

If new stock is scooters only, the long-term SEO target should be:

- `/inventory/scooters/new`

The current `/inventory/motorcycles/new` URL may be confusing if it mostly or only lists scooters. This does not have to be changed immediately, but the URL and page copy should eventually align with the actual inventory.

### Consolidate Electric Scooter Pages

Avoid running both of these as independent SEO pages:

- `/electric-scooters`
- `/escooters`

Pick one canonical target. `/electric-scooters` is clearer for users and search engines unless `/escooters` has stronger historical links or performance. The non-canonical page should redirect or canonicalize to the chosen target.

### Keep Service and Tyre Fitting Separate

`/service` and `/tyre-fitting` should remain separate pages because they match different search intents:

- General servicing and repair
- Tyre fitting and tyre repair

They should link to each other where useful, but one should not absorb the other.

## Blog Content Role

Blog posts should support the commercial pages, not compete with them.

Good blog topics are informational queries such as:

- `do you need a licence for a scooter in wa`
- `50cc vs 125cc scooter`
- `moped vs scooter`
- `petrol vs electric scooter`
- `how much does scooter servicing cost`
- `what scooter can i ride on a car licence in wa`
- `best scooter for commuting in perth`

Each blog post should link back to the relevant commercial page. For example, a `50cc vs 125cc scooter` guide should link to the new and used scooter inventory pages, not only to the homepage.

Avoid blog posts that directly duplicate commercial page targets, such as a blog post trying to rank for `scooters for sale perth`. That query should belong to an inventory or category page.

## Next Data Needed

The most useful next export from Google Search Console is query-by-page data.

Recommended exports:

- Homepage queries
- `/hire` queries
- `/electric-scooters` queries
- `/escooters` queries
- `/service` queries
- `/tyre-fitting` queries
- Used inventory queries
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
