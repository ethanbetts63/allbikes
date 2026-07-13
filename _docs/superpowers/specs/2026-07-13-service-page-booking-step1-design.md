# Service Page Booking Step 1 — Design

**Date:** 2026-07-13
**Status:** Approved by Ethan (pending spec review)

## Goal

Move step 1 of the service booking wizard (drop-off date, time, job types, notes) onto the `/service` page hero, futureflower-style: marketing copy on the left, a live booking form card on the right. `/service-booking` becomes steps 2–3 only. The landing page *is* step 1.

Reference pattern: futureflower `page_components/home.tsx` + `components/home_page/HomeStarterForm.tsx` — a server-rendered marketing page with a `"use client"` form island in the hero that hands off to step 2 of the flow.

## Decisions made

1. **Step 1 moves entirely to `/service`** — no duplicate step 1 on `/service-booking`. Single source of truth.
2. **Form sits in the hero** — replaces `ServiceCTAV2` on `/service` with a two-column hero (copy left, form card right). Strongest conversion placement.
3. **Other pages point to `/service`** — the "Book Online" links on home, motorcycle-service, scooter-service, vespa-service-perth, and tyre-fitting pages change target from `/service-booking` to `/service`. `ServiceCTAV2` itself is unchanged on those pages. Safety net: `/service-booking` redirects to `/service` when step-1 data is missing.

## Architecture

- `/service` (`page_components/ServicePage.tsx`) stays a **server component**. SEO metadata, structured data, reviews, services grid, service areas, movers, and FAQ are unchanged.
- New `ServiceBookingHero` (server component): two-column hero section. Left: bold typographic block + condensed checklist (derived from `ServiceCTAV2`'s content). Right: renders the client island.
- New `BookingStarterCard` (`"use client"`): light card on the dark hero (contrast trick from futureflower's white card on beige). Wraps the existing `BookingDetailsForm` — reused, not duplicated. Its three API fetches (job types, unavailable days, service settings) already run client-side on mount, so server rendering/SEO is unaffected.
- `ServiceBookingPage` (`page_components/ServiceBookingPage.tsx`) becomes steps 2–3 (`Bike Details`, `Your Details`). Step indicator shows step 1 as done, linking back to `/service#book` for edits.

## Data flow

- Handoff channel: the existing `bookingFormProgress` localStorage key.
- `BookingStarterCard` initializes from it (returning users keep their picks) and writes on every change, same as the wizard does today.
- "Next: Bike Details" navigates to `/service-booking`.
- On `/service-booking` mount: if `bookingFormProgress` lacks step-1 data (`drop_off_time` empty or `job_type_names` empty), redirect to `/service`.
- **Fix existing rehydration gap:** `BookingDetailsForm` keeps `selectedDate`/`selectedTime` in local state and never parses them back from `formData.drop_off_time` (`dd/MM/yyyy HH:mm`). Parse on init so the pickers don't silently reset when a user returns to edit step 1.

## Error handling

- API fetch failure in `BookingDetailsForm` currently logs to console and shows "Loading services..." forever. Add a visible fallback in the card: error message, workshop phone number `(08) 9433 4613`, and a retry button. A broken hero form on the main SEO landing page must fail loudly and offer an alternative.

## Testing

- `BookingStarterCard` persists to and rehydrates from `bookingFormProgress`.
- `drop_off_time` round-trips into `selectedDate`/`selectedTime` on init.
- `/service-booking` redirects to `/service` when step-1 data is missing; renders steps 2–3 when present.
- Step-3 submit still posts the full payload (`createBooking`) and clears `bookingFormProgress`.
- Manual end-to-end run-through: fill hero form on `/service` → steps 2–3 on `/service-booking` → confirmation page.

## Out of scope

- Rolling the form-in-hero component out to motorcycle/scooter/vespa/tyre pages (possible later phase).
- Any backend/API changes — the Django `service` app endpoints are used as-is.
- Redesigning `ServiceCTAV2` on the five pages that keep it.

## Files expected to change

- `frontend/page_components/ServicePage.tsx` — swap `ServiceCTAV2` for `ServiceBookingHero`.
- `frontend/components/ServiceBookingHero.tsx` — new.
- `frontend/components/BookingStarterCard.tsx` — new.
- `frontend/forms/ServiceBookingDetailsForm.tsx` — rehydration fix, error fallback, style-context flexibility.
- `frontend/page_components/ServiceBookingPage.tsx` — steps 2–3, redirect guard, revised step indicator.
- `frontend/components/ServiceCTAV2.tsx` — its hardcoded "Book Online" href changes `/service-booking` → `/service` (this covers all five pages that keep the CTA).
- `frontend/page_components/MotorcycleServicePage.tsx`, `ScooterServicePage.tsx`, `VespaServicePage.tsx`, `TyreFittingPage.tsx` — additional inline `/service-booking` links → `/service`.
