# ① Data Pipeline — Design

**Date:** 2026-07-24 · **Subsystem 1 of 5** · **Depends on:** nothing
**Parent:** `sym_parts_00_overview.md`

## 1. Purpose & scope

Turn the Select Portal source (parts book `.xls` files + Price & Availability CSV)
into a clean, queryable catalog in our database — fully automated on a cron, with
no manual data entry. This subsystem produces the data that everything else reads.

**In scope:** scraping the source page, downloading + parsing `.xls` books,
extracting diagram images, parsing the PA CSV, the catalog data model, upsert
logic, change detection, and the scheduled commands.

**Out of scope:** any API or UI (subsystem ②), ordering (③).

## 2. New Django app: `parts`

Follows the existing app layout (`models/`, `views/`, `serializers/`,
`management/commands/`, `utils/`, `tests/`). This spec adds only the **models**,
**ingestion utilities**, and **management commands**. Views/serializers arrive in
subsystem ②; ordering models in subsystem ③ (same app).

```
parts/
  models/
    parts_model.py        # PartsModel
    part_section.py       # PartSection
    section_part.py       # SectionPart
    part.py               # Part
  ingestion/
    source_page.py        # scrape the Select Portal index page
    xls_parser.py         # parse one .xls -> structured dict
    escher_images.py      # extract diagram images from .xls (spike code, hardened)
    pa_csv.py             # parse the Price & Availability CSV
    importer.py           # upsert structured data into the models
  management/commands/
    sync_parts_books.py   # weekly: refresh model books
    sync_parts_pricing.py # daily: refresh prices/availability
```

## 3. Data model

### 3.1 `PartsModel` — one per `.xls` book
| Field | Type | Notes |
|---|---|---|
| `name` | CharField | e.g. `Classic 150` (display name from source page) |
| `model_code` | CharField, unique | e.g. `AX15W2-6` (from book header cell; the stable key) |
| `cc_class` | CharField, choices | `50`, `100_165`, `200_400`, `atv` |
| `slug` | SlugField, unique | for URLs, e.g. `classic-150-ax15w2-6` |
| `source_xls_url` | URLField | direct download URL |
| `source_filename` | CharField | last path segment |
| `book_hash` | CharField | sha256 of the downloaded file (change detection) |
| `last_ingested_at` | DateTimeField | |
| `is_active` | BooleanField | false if it disappears from the source page |

### 3.2 `PartSection` — one per E/F section sheet
| Field | Type | Notes |
|---|---|---|
| `parts_model` | FK → PartsModel, `related_name='sections'` | |
| `code` | CharField | `E01`, `F14` |
| `group` | CharField, choices | `engine`, `frame` |
| `name` | CharField | `Shroud Assy` (from section header / group index) |
| `diagram_image` | ImageField | extracted diagram (see §4.3) |
| `sort_order` | PositiveInteger | natural sheet order |

`unique_together = (parts_model, code)`.

### 3.3 `SectionPart` — one row per callout line in a section table
| Field | Type | Notes |
|---|---|---|
| `section` | FK → PartSection, `related_name='parts'` | |
| `part` | FK → Part, `related_name='section_parts'`, PROTECT | join target |
| `ref_number` | CharField | `2`, `2-1` — matches the number printed on the diagram |
| `description` | CharField | as printed in this book (may differ per book) |
| `quantity` | PositiveInteger | qty used in this assembly |
| `effective_date` | DateField, null | parsed from the Excel serial (running-change date) |
| `superseded_flag` | CharField, blank | the `Y`/`N` column value |
| `sort_order` | PositiveInteger | row order within the section |

A single `ref_number` may have multiple `SectionPart` rows (dated variants) — this
is how "year" is surfaced inline (subsystem ②).

### 3.4 `Part` — one per unique part number (the pricing/stock join target)
| Field | Type | Notes |
|---|---|---|
| `part_number` | CharField, unique | e.g. `93904-35380` — canonical key |
| `description` | CharField | canonical description (from PA CSV if present, else book) |
| `price_rrp_incl_gst` | Decimal, null | from PA `RRP+GST`; null = unknown |
| `available_qty` | Integer, null | from PA `AVAILABLE`; null = not in PA feed |
| `in_pa_feed` | BooleanField | true if present in the latest PA CSV |
| `price_updated_at` | DateTimeField, null | when pricing was last refreshed |

**Orderability rule** (used by ② and ③): a part is orderable iff `in_pa_feed` is
true, `price_rrp_incl_gst` is not null, and (for display) `available_qty` may be 0
or positive. Parts not in the PA feed are shown greyed-out and cannot be added to
cart — matching easyparts' greyed rows.

## 4. Ingestion pipeline

### 4.1 `source_page.py` — scrape the index
- Fetch `https://www.selectportal.com.au/sym-spare-parts-books/`.
- Parse with BeautifulSoup:
  - **Book links:** every `<a href="*.xls">` under the model listing, capturing
    link text (display name), href, and the surrounding cc-class heading.
  - **PA CSV link:** the nav link labelled "SYM Spare Parts Price & Availability"
    → `href` (e.g. `.../uploads/2026/07/PA-16-Jul-26.csv`).
- Returns `{books: [{name, cc_class, url}], pa_url, pa_date}` where `pa_date` is
  parsed from the PA filename (`PA-16-Jul-26` → `2026-07-16`).

### 4.2 `xls_parser.py` — parse one book
Uses `xlrd` (cells) for the tables and `escher_images.py` for diagrams.
- **Model code / name:** read from the header cell of any `E*`/`F*` sheet
  (e.g. `AX15W2-6 [FIDDLE II]`) and the `No.index1` `MODEL:` cell as cross-check.
- **Sections:** iterate sheets matching `^[EF]\d\d$`. For each:
  - `group` from prefix (`E`→engine, `F`→frame).
  - `name` from the section header cell; fall back to the group-index sheets
    (`Eng. group*`, `Frame group*`) which map code→name.
  - **Parts table:** locate the header row (`PARTS NUMBER` / `DESCRIPTION` /
    `QTY` / `EFFECTIVE DATE`) and read rows below it until blank. Emit
    `{ref_number, part_number, description, quantity, effective_date,
    superseded_flag, sort_order}`. Convert Excel serial dates via
    `xlrd.xldate_as_datetime`.
- Returns a structured dict:
  `{model_code, model_name, sections: [{code, group, name, diagram, parts:[...]}]}`.

### 4.3 `escher_images.py` — extract diagrams (spike-proven)
Deterministic, pure Python. Algorithm (validated in the feasibility spike):
1. Open the OLE file with `olefile`; read the `Workbook` stream.
2. Reassemble the drawing group: concatenate `MSODRAWINGGROUP` (BIFF `0x00EB`)
   record bodies plus their trailing `CONTINUE` (`0x003C`) records.
3. Walk the Escher tree to `DggContainer (0xF000) → BStoreContainer (0xF001)`;
   iterate its `BSE (0xF007)` children **in order** → the ordered BLIP list
   (BStore index = position + 1). For each BSE, **locate the image signature
   dynamically** (`\xFF\xD8\xFF` JPEG / PNG magic) rather than a fixed offset, and
   validate by decoding with `Pillow`.
4. Per section sheet: parse the sheet substream (between its `BOF`/`EOF`),
   collect `MSODRAWING` (`0x00EC`) + `CONTINUE` records, walk Escher `OPT`
   (`0xF00B`) for the `pib` property (opid `& 0x3FFF == 0x0104`) → BStore index.
   The section diagram is the **largest-area** referenced blip (guards against
   small overlaid thumbnails).
5. Save each diagram to the `PartSection.diagram_image` field (re-encode to PNG
   for consistency).

**Robustness:** signature is found dynamically; blips that fail to decode are
skipped with a warning; a section with no decodable diagram is imported with a
null image and logged (does not abort the book).

### 4.4 `pa_csv.py` — parse Price & Availability
- Download the CSV. Columns: `PART NUMBER, DESCRIPTION, AVAILABLE, RRP+GST, ADD GST`.
- Normalise: strip whitespace, parse `$###.##` → Decimal, `AVAILABLE` → int.
- Returns an iterator of `{part_number, description, available, price}`.
- The file is large (~thousands of rows); stream row-by-row.

### 4.5 `importer.py` — upsert
- **Books:** for each source book, download; if `sha256` == stored `book_hash`,
  skip. Else parse and upsert inside a transaction:
  - upsert `PartsModel` (by `model_code`);
  - replace its `PartSection`s and `SectionPart`s (delete-and-recreate per book is
    simplest and safe — books are self-contained and rarely change);
  - `Part.objects.get_or_create(part_number=...)` for every callout, setting
    `description` if the Part is new;
  - save diagram images.
- **Pricing:** for each PA row, `update_or_create` the `Part` (by `part_number`),
  setting `price_rrp_incl_gst`, `available_qty`, `in_pa_feed=True`,
  `price_updated_at=now`. After the pass, set `in_pa_feed=False` on any Part not
  seen in this file (marks discontinued parts unorderable).

## 5. Scheduled commands

Follows the existing "management command on a cron" convention (as with
`send_admin_reminders`).

- **`sync_parts_pricing`** — daily.
  1. Scrape page → `pa_url`, `pa_date`.
  2. If `pa_date` ≤ last successful import date, log "no change" and exit.
  3. Else download + import PA CSV (§4.4/4.5). Record the import date + row count.
  - Flags: `--force` (re-import regardless of date), `--url` (override source).

- **`sync_parts_books`** — weekly (books "should never change", but we re-verify).
  1. Scrape page → book list.
  2. For each book, download; skip if hash unchanged; else parse + import.
  3. Mark `is_active=False` on any `PartsModel` whose book vanished from the page.
  - Flags: `--model-code`/`--slug` (one book), `--force`, `--file` (import a local
    `.xls`, e.g. the sample already in `data_management/data/sym_parts_files/`).

Cron wiring uses the same mechanism the project already uses for scheduled
commands (documented in the plan; see open decision D5).

## 6. State & idempotency

- A small `PricingImport` record (or a `django-solo`-style singleton, matching the
  existing `DepositSettings.get()` pattern) stores `last_pa_date`,
  `last_pa_imported_at`, `last_pa_row_count`. Change detection reads this.
- Book hashes live on `PartsModel`. Re-running either command is safe and cheap
  (no-ops when nothing changed).
- Downloads write to a temp dir (the project scratchpad / `data_management/data`),
  not committed to git.

## 7. Error handling

- Network/download failure on the page or a file → log, abort *that item*,
  continue others; command exits non-zero if any item failed (so cron alerts).
- A malformed book (missing header row, no sections) → skip the book, log, keep
  the previously-imported version; never leave a half-imported book (transaction).
- A diagram that won't decode → import the section without an image; log.
- PA CSV missing/short → do not wipe existing pricing; abort the pricing import.

## 8. Testing

- **Unit (fixtures = the sample book + sample PA CSV already in the repo):**
  - `escher_images`: extracts ≥1 decodable diagram per E/F section; images are
    valid PNGs of plausible size.
  - `xls_parser`: correct section count, section names, and known part rows
    (assert the E01 "Shroud Assy" callouts incl. the dated `18241-*` variants).
  - `pa_csv`: parses prices/availability; handles `$`/whitespace.
- **Integration:** `sync_parts_books --file <sample.xls>` populates PartsModel /
  PartSection / SectionPart / Part correctly; re-running is a no-op (hash match).
- **Pricing:** `sync_parts_pricing --url <sample.csv>` sets prices + `in_pa_feed`;
  a second file with a part removed flips that part's `in_pa_feed=False`.
- **Change detection:** older `pa_date` → skipped; `--force` overrides.
- Uses `pytest` + factories, matching the existing test structure.

## 9. Open decisions (for review)

- **D1 — Pricing/markup:** MVP uses PA `RRP+GST` as the customer price with **no
  markup**. Drop-ship margin model needs confirming before launch (flat %, per-cc,
  or none). Isolated to `Part.price_rrp_incl_gst` consumption in ②/③.
- **D2 — Section name source:** primary from section header cell, fallback to
  group-index sheets. If some books lack clean headers we may need the group-index
  as primary. Verify across several books during implementation.
- **D3 — Delete-and-recreate vs. diff on re-import:** spec chooses delete-and-
  recreate per book for simplicity. Because `SectionPart.part` is PROTECT and
  `Part` rows persist, this won't cascade-delete pricing. Confirm no `PartsOrder`
  (③) FKs point at `SectionPart` (they snapshot part_number instead — see ③).
- **D4 — Model code extraction reliability:** verified on one book. Validate the
  header-cell + `No.index` cross-check across the full catalog; fall back to
  deriving the code from the source filename if a book's cells are inconsistent.
- **D5 — Cron mechanism:** confirm how existing scheduled commands are triggered
  (Windows Task Scheduler / server cron / hosting scheduler) and wire both
  commands into it.

## 10. Definition of done

`sync_parts_books` + `sync_parts_pricing` populate the catalog from live Select
Portal data; diagrams render; prices/availability attach by part number; re-runs
are idempotent; change detection works; tests pass against the repo sample files.
