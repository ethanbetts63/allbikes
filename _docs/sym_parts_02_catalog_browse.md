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
Rows are grouped by `ref_number` (callout). A callout with one part renders as a
simple row; a callout with several parts (year and/or colour variants) renders as
a group the UI can present with a picker:
```jsonc
{
  "ref_number": "6",
  "callout_label": "FR. Handle Cover",   // shared description for the group
  "variant_axis": "colour",              // "colour" | "date" | "none"
  "variants": [
    {
      "part_number": "53205-ALA-000-RD",
      "description": "FR. Handle Cover (R-010CA)",
      "colour_name": "Red",              // null for non-colour parts
      "paint_code": "R-010CA",           // null if unknown
      "effective_date": null,            // set for date-variant axes
      "variant_label": "Red",            // colour name, or "up to/from <date>"
      "quantity": 1,
      "price": "171.60",                 // customer price = wholesale × (1+markup)
      "available_qty": 0,                // advisory; 0 = backorderable
      "backorder": true,                 // orderable but available_qty < needed
      "orderable": true                  // in_pa_feed && wholesale price != null
    }
    // …one entry per colour / date variant
  ]
}
```
- **`variant_axis`:** `colour` if the group's parts share a `base_part_number` and
  differ by `colour_suffix`; `date` if they differ by `effective_date`; `none` for
  a single part. Drives which picker the UI shows.
- **Price** is the customer price: `wholesale_price_incl_gst × (1 +
  PartsSettings.markup_percentage/100)`, rounded to 2dp, computed server-side.
  Never expose the wholesale price.
- **`variant_label`** is derived server-side: colour name for colour axes;
  `"up to <date>"` / `"from <date>"` for date axes. This is how "year" and colour
  are surfaced (overview §5).
- **`backorder`** flags a part that is orderable but understocked (`available_qty`
  < requested / 0) — the UI shows a "backorder" note but still allows adding.

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
- **Colour picker (per-callout):** when `variant_axis == "colour"`, the callout
  renders one row with a **colour dropdown** (human colour names + swatch/paint
  code), and price + stock update to the selected colour. Add-to-cart uses the
  chosen colour's specific part number. No global colour step — the choice lives on
  the callout where it matters (overview §5). Helper copy: *"Pick the colour
  matching your bike. Unsure of the code? We'll confirm before dispatch."*
- **Date-variant badges:** when `variant_axis == "date"`, variants show a badge
  (e.g. "up to 2013") with: *"Running change — pick the variant matching your
  bike's build date. Unsure? We'll confirm before dispatch."*
- **Backorder note:** a variant with `backorder: true` shows a small "Backorder —
  ships when restocked" note but remains addable.

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
  staleness ≤ 24h, or bust on `import_parts_pricing` run.
- **SEO:** model and section pages are good long-tail SEO targets (part numbers,
  model names). Server-render them; add basic metadata + sitemap entries.

## 5. Error / edge handling

- Model or section not found → 404 page.
- Section with a null diagram (extraction failed for that sheet) → show the parts
  list only, with a note; still fully orderable.
- All rows in a section unorderable → render greyed; no cart affordance.
- Search with no results → empty state suggesting a part-number or model search.

## 6. Testing

- **API:** serializer tests for the section payload incl. callout grouping +
  `variant_axis` detection (colour vs date vs none), markup applied to price,
  wholesale price never exposed, `orderable`/`backorder` logic; search ranking
  (part number exact beats description match); greyed part excluded from orderable.
- **Frontend:** component tests for the core screen (renders diagram + list, popup
  opens on orderable row only, **colour dropdown** appears for colour callouts and
  swaps price/stock/part-number, date badge shows, backorder note shows). E2E happy
  path: model → section → pick colour → add to cart (cart assertions live in ③).

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

A customer can browse from `/parts` to a section diagram, see marked-up prices +
stock, search by part number/model, pick a colour on painted callouts, and add
orderable parts to a cart. Unorderable (not-in-feed) parts are visibly greyed;
understocked parts are addable as backorders. Year and colour variants are
surfaced inline per callout.
