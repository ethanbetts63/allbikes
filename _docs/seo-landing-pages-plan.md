# 50cc and Vespa Search Landing Pages

## Summary

Create two self-canonical, search-focused pages at `/50cc-scooters-perth` and `/vespa-perth`. They will reuse the homepage's design and components while replacing irrelevant e-scooter, hire, brand, and FAQ content with page-specific material.

Both pages will use server-fetched inventory with a five-minute revalidation period. Bike cards and links will be present in server HTML; only carousel controls and rotating hero images remain client-side.

## Implementation Changes

### Shared page infrastructure

- Extend the homepage hero to accept configurable eyebrow, H1 lines, description, panel titles, links, alt text, fallback images, and an optional service strip.
- Support the existing two-inventory-panel layout for 50cc and a simplified text-plus-one-inventory-panel layout for Vespa.
- Remove the `ssr:false` featured-bike wrapper. Render `FeaturedBikes` and `SmallBikeCard` as Server Components while retaining `FeaturedBikesCarouselControls` as the small client-side interaction boundary.
- Extend `ServiceCTAV2` with configurable eyebrow, heading, checklist, subtitle, destination, and button text.
- Generalise the current brand-card presentation so landing pages can supply topic-specific image, heading, copy, and CTA cards while homepage defaults remain unchanged.
- Add a shared inventory prioritiser that places active target bikes first, sold target bikes second, and deduplicated normal featured bikes last while excluding unavailable bikes.
- Correct the frontend `Bike` type so nullable API fields such as `engine_size` are represented safely.

### `/50cc-scooters-perth`

- Metadata title: `50cc Scooters for Sale Perth | New & Used Mopeds`.
- Metadata description: `Shop new and used 50cc scooters in Perth. View current stock, learn which mopeds can be ridden on a WA car licence, or book workshop servicing.`
- H1: `Perth's 50cc Scooter Specialists`.
- Use the current two-panel homepage hero:
  - `New 50cc Scooters` -> `/inventory/scooters/new?max_engine_size=50`
  - `Used 50cc Scooters` -> `/inventory/scooters/used?max_engine_size=50`
  - `Get Your 50cc Scooter Serviced` -> `/scooter-service`
- Fetch new/demo and used scooters with `max_engine_size=50`; the backend comparison is inclusive, so `51` must not be used.
- Use active 50cc inventory only for rotating hero imagery. Fall back to existing 50cc/SYM imagery when no qualifying active bike exists.
- Carousel order:
  - Featured new 50cc scooters, then normal featured new scooters.
  - Featured used 50cc scooters, then sold 50cc examples, then normal featured used scooters.
- Page order: hero, default reviews, new carousel, 50cc service CTA, used carousel, payment section, two topic cards, visible FAQs, and `/scooter-service` floating CTA.
- Topic cards cover WA's exact moped/car-licence requirements and new, used, workshop-backed 50cc scooters in Dianella.
- Correct the live `engine_size` data for the SYM Ute Scoot 50 and the used 2006 Vespa LX50 before deployment so they appear in filtered results.

### `/vespa-perth`

- Metadata title: `Used Vespa Scooters for Sale & Service Perth`.
- Metadata description: `Browse used Vespa scooters in Perth and access specialist Vespa servicing from a Dianella workshop with more than 30 years of hands-on experience.`
- H1: `Perth's Vespa Specialists`.
- Use the simplified hero with the main text panel and one rotating `Used Vespa Scooters` inventory panel linking to `/inventory/scooters/used` without query parameters.
- Fetch used scooters with `search=vespa`, then retain only exact case-insensitive `make === "vespa"` matches.
- Use active Vespa inventory only in the hero, with the existing local Vespa asset as the no-stock fallback.
- Keep the normal featured-new-scooter carousel unchanged.
- Order the used carousel as active Vespas, sold Vespas, then deduplicated normal featured used scooters.
- Page order: hero, Vespa-specific reviews, new-scooter carousel, Vespa service CTA, used-scooter carousel, payment section, two Vespa topic cards, visible FAQs, and `/vespa-service-perth` floating CTA.

### SEO and discovery

- Add both routes to the XML sitemap and footer Quick Links; do not add them to the main navigation.
- Add contextual links from the WA licence guide to the 50cc page, and from the Vespa service and used-scooter pages to the Vespa hub.
- Emit LocalBusiness, BreadcrumbList, and an ItemList containing only the page's target bikes. Keep FAQs visible but do not add new FAQPage schema.
- Preserve `/vespa-service-perth` as the service-intent owner and the licence article as the informational-intent owner.
- On API failure, render the static hero fallback and topic content while omitting empty carousels.

## Test Plan

- Add API coverage confirming `max_engine_size=50` includes 49cc/50cc records, excludes 51cc, and excludes null capacities.
- Verify prioritisation with active, coming-soon, reserved, sold, unavailable, and duplicate target/fallback bikes.
- Run frontend lint/build and the relevant Django inventory tests.
- Inspect server HTML for the homepage and both new routes for one H1, correct canonicals, server-rendered bike links, correct ordering, no duplicates, and no unavailable bikes.
- Confirm hero rotation never uses sold inventory and static fallbacks appear when target stock is empty.
- Confirm carousel controls, filtered links, service links, and responsive layouts.
- Regression-check that the homepage's visual content remains unchanged while its featured bike cards become server-rendered.

## Assumptions

- `50cc` means petrol scooters with an entered engine capacity of 50cc or less; electric mopeds are not included.
- Sold target bikes remain useful topical evidence but appear only after active target inventory.
- Focused clones omit the homepage's e-scooter and hire modules.
- Filter links use compact query strings rather than empty filter parameters.
- No database schema, public API, or redirect changes are required; only the two identified inventory records need operational data correction.
- The existing unrelated `.gitignore` modification remains untouched.
