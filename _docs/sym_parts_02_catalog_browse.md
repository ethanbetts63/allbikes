# ② Catalog API + Browse UI — Design

**Date:** 2026-07-24 · **Subsystem 2 of 5** · **Depends on:** ① (catalog data)
**Parent:** `sym_parts_00_overview.md`

## 1. Purpose & scope

Let a customer find a part by browsing **Model → Section → Diagram** or by
searching, and add orderable parts to a cart. Mirrors the easyparts *flow*, not
its look. Read-only over the catalog built in ①; the cart/checkout is ③.

**In scope:** DRF read endpoints, search, and the Next.js browse pages incl. the
diagram + numbered-parts interaction and the add-to-cart affordance.

**Out of scope:** ingestion (①), cart persistence + checkout + payment (③).

## 2. Backend — DRF read API (`parts/views`, `parts/serializers`)

All endpoints are public (`AllowAny`, no auth), read-only, GST-inclusive prices.

| Endpoint | Returns |
|---|---|
| `GET /api/parts/models/` | list of `PartsModel` (name, model_code, cc_class, slug), grouped/filterable by `cc_class` |
| `GET /api/parts/models/<slug>/` | model detail + its `PartSection` list (code, name, group, diagram thumb URL, sort_order) |
| `GET /api/parts/sections/<id>/` | section detail: diagram image URL + ordered `SectionPart` rows, each enriched with the joined `Part` (price, availability, orderable flag) |
| `GET /api/parts/search/?q=` | unified search across part number, description, and model name |

### 2.1 Section detail payload (the core screen)
For each `SectionPart` row, serialize:
```jsonc
{
  "ref_number": "6",
  "part_number": "18241-F6S-000",
  "description": "Exh. Pipe Protector",
  "quantity": 1,
  "effective_date": "2013-05-01",       // null if none
  "variant_label": "from May 2013",     // derived; null if the ref has one variant
  "price": "12.50",                     // Part.price_rrp_incl_gst, null if unknown
  "available_qty": 2,                   // Part.available_qty, null if not in feed
  "orderable": true                     // Part.in_pa_feed && price != null
}
```
- **Variant grouping:** rows sharing a `ref_number` are returned adjacently and
  ordered by `effective_date`. `variant_label` is derived server-side: single
  variant → null; multiple → `"up to <date>"` / `"from <date>"` labels so the UI
  can badge them. This is how "year" is surfaced (see overview §2).

### 2.2 Search
- One box, `q`. Query strategy:
  - exact/prefix match on `Part.part_number` (highest priority),
  - `icontains` on `Part.description` and `SectionPart.description`,
  - `icontains` on `PartsModel.name` / `model_code`.
- Results are grouped: **Parts** (part number → the sections/models it appears in,
  with price + orderable) and **Models** (matching bikes). A part can appear in
  many sections/models; results link to the section diagram context.
- MySQL `LIKE`-based for MVP; note a fulltext index as a later optimisation.

## 3. Frontend — Next.js pages (`frontend/app/parts/`)

Follows the existing app-router + Tailwind + shadcn structure and the site's
API-proxy convention (`/api/*` → backend).

| Route | Screen |
|---|---|
| `/parts` | Landing: cc-class groups → model grid (name + model_code). Search bar prominent at top. |
| `/parts/[modelSlug]` | Section grid: diagram thumbnails labelled by section name (engine group then frame group). |
| `/parts/[modelSlug]/[sectionId]` | **Core screen:** big diagram on the left, numbered parts list on the right. |
| `/parts/search?q=` | Grouped search results (Parts / Models). |

### 3.1 Core screen interaction (mirrors easyparts)
- **Left:** the extracted diagram image (zoomable — simple CSS zoom / pan is
  enough for MVP; the callout numbers are baked into the image).
- **Right:** the ordered parts list. Each row shows `ref_number`, description,
  price, and a stock/orderable indicator (green dot = available; greyed +
  non-interactive when `orderable=false`, matching easyparts).
- **Add to cart:** clicking an orderable row opens a small popup (qty field
  default 1, price, "fits <model>", **Add to cart**) — same affordance as
  easyparts' part popup. Adds a line item to the cart (③).
- **Variant badges:** rows with a `variant_label` show a small badge
  (e.g. "up to 2013") and a short helper: *"Running change — pick the variant
  matching your bike's build date. Unsure? We'll confirm before dispatch."*

### 3.2 Search UX
- Debounced query to `/api/parts/search`. Part results link straight to the
  section diagram that contains them (with the row highlighted); model results
  link to the model's section grid.

## 4. Non-functional

- **Images:** served from Django media (or the existing media/CDN setup used by
  `product`/`inventory` images). Thumbnails generated with the existing
  `resize_images` approach or Next/Image. Diagrams are ~500×400 line art; cheap.
- **Caching:** catalog is static between ingests; section/model responses are
  safe to cache (HTTP cache headers / ISR). Pricing changes daily — acceptable
  staleness ≤ 24h, or bust on `sync_parts_pricing` run.
- **SEO:** model and section pages are good long-tail SEO targets (part numbers,
  model names). Server-render them; add basic metadata + sitemap entries.

## 5. Error / edge handling

- Model or section not found → 404 page.
- Section with a null diagram (extraction failed for that sheet) → show the parts
  list only, with a note; still fully orderable.
- All rows in a section unorderable → render greyed; no cart affordance.
- Search with no results → empty state suggesting a part-number or model search.

## 6. Testing

- **API:** serializer tests for the section payload incl. variant grouping +
  `orderable` logic; search ranking (part number exact beats description match);
  greyed part excluded from orderable.
- **Frontend:** component tests for the core screen (renders diagram + list, popup
  opens on orderable row only, variant badge shows). E2E happy path:
  model → section → add to cart (cart assertions live in ③).

## 7. Open decisions (for review)

- **O1 — cc-class landing vs. flat model list:** spec uses cc-class groups on
  `/parts` (50 models is a lot flat). Confirm the grouping labels/order.
- **O2 — Diagram zoom:** MVP = CSS zoom/pan. A hotspot-highlight (hovering a list
  row dims the diagram except its callout) is explicitly **out of scope** — the
  images have no coordinate metadata; would require per-part manual mapping.
- **O3 — Search backend:** `LIKE` for MVP; revisit MySQL FULLTEXT if slow.
- **O4 — Price display when unknown:** greyed rows show "Not available" (no price)
  rather than "$0.00". Confirm copy.

## 8. Definition of done

A customer can browse from `/parts` to a section diagram, see prices + stock,
search by part number/model, and add orderable parts to a cart. Unorderable parts
are visibly greyed and non-interactive. Variant/year differences are badged inline.
