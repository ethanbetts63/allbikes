# SYM Parts — Competitor Research

Based on raw HTML (title/meta, JSON-LD, model lists, URL patterns), not visual
browsing. Round 1: 2026-08-02. Round 2 follow-up: 2026-08-03.

## Sites reviewed

| Site | Notes |
|---|---|
| Mick Hone (mickhone.com.au) | AU dealer, closest direct competitor. Same fiche/diagram model as us. ~35 models incl. Classic 50 but no Classic 150. Zero JSON-LD. **Live bug**: `<title>`/meta literally read "SYM 0 Models" — a template counter not populating server-side. No VIN lookup. |
| Wemoto AU (wemoto.com.au) | UK reseller's AU branch. Category browsing, not diagram-based. URLs `/bike/sym/{name}/{cc}` — no model code, can't disambiguate variants. Sells OEM + aftermarket. Only `Organization` schema. |
| Bike-Parts-SYM.com | Strongest competitor, French-owned, sells to 8 countries. Markets 3 lookup methods (model/year, keyword, VIN) + part-number search. Model codes include emissions standard + year (e.g. `XH12WX-EU E5 M1`) — worth checking if our catalogue is missing similarly-versioned variants. "Most viewed diagrams/models" modules. Real `hreflang` across 8 ccTLD-style domains. Repeated trust badges. |
| GPS Imports (gpsimports.com.au) | Mainly a Lambretta/Vespa specialist; SYM is a minor bolt-on. No model selector or diagrams, flat category browsing. Weakest of the five. |
| EasyParts.com | Large Dutch/EU multi-brand retailer. Same vehicle-filter → diagram shape as us. On-page FAQ explains *where on the bike* to find frame/model/engine numbers — we don't have this. Trust signals: "40 years", "175,000 parts", live Kiyoh review widget (9.3/2,204). `WebSite`+`SearchAction` schema. No `FAQPage` schema despite having FAQ content (correctly, given Google's Aug-2023 restriction to gov/health sites). |

## Ideas worth acting on (round 1)

1. **"Where to find your VIN/frame/model number" content** (EasyParts) — cheap addition to `HowPartsLookupWorks`, closes a real gap, could pull its own search traffic.
2. **"Most viewed models/diagrams" module** (Bike-Parts-SYM) — derivable from order-line data we already snapshot; free content + internal linking.
3. **Model-year/emissions-standard fitment granularity** (Bike-Parts-SYM) — check whether Select Portal data already distinguishes Euro5/year variants for models we carry, or whether we're silently missing some.
4. **Trust badge row / review count in the parts section** — we have `ReviewCarousel` on the homepage already; nothing borrows it into `/parts`.
5. **Zero structured data is the norm** — only EasyParts has any schema at all, nobody has Product/Offer. The work already done this session puts us ahead of all five here.
6. **Nobody frames Australia-only shipping as a benefit** — the two international players lead with "worldwide delivery." For an AU buyer, "ships from Australia, no customs/import risk" is a differentiator, currently phrased on our site as a disclaimer rather than a selling point.

## Round 2 follow-up

**1. Live SERP checks** — ran 5 real queries (e.g. "SYM Classic 150 parts Australia", "buy SYM motorcycle parts online Australia"). Every competitor appeared at least once; we appeared zero times — our own domain surfaced only old legacy pages (`/sym-crox-50`, `/brand/sym-bolwell`), not the new catalogue. **Explained and not a concern**: `/parts/new/sym` had been live only ~24h at check time — indexing ~1,900 pages takes days–weeks regardless of sitemap quality. Re-check in a few weeks. (Caveat: manual snapshot, not a rank tracker.)

**2. More AU competitors** — found via the SERP checks: symscooters.com.au (Melbourne, quote-only), scootercentral.com.au, scooterdynasty.com, scooterstreet.com.au, teamshowandgo.com.au, scooterpartsco.com (dated Zen Cart-style site). None run a diagram/fiche tool — Mick Hone is still the only real AU equivalent. Also confirmed `scoota.com.au` is SYM's official AU site — dealer locator + brand showcase only, not a competitor. **Actionable**: its retailer directory lists a "Scooter Shop" at a Fremantle address, not our current Dianella one — almost certainly our own listing (matches the `alternateName` "ScooterShop Fremantle" already in our schema) sitting stale on an authoritative brand-owned domain. Worth getting corrected via SYM/Select Portal.

**3. Deeper Bike-Parts-SYM pass** — fetched an actual model + diagram page. Their section URLs spell out the section name in the slug (`.../CARBURETOR/233/1/0/962`); ours uses the bare code only (`.../E01`), with the name only in title/H1. **Real, fixable URL keyword gap.** Confirmed zero schema even at leaf pages. Noted an "add to my garage" saved-vehicle feature — not worth chasing since accounts are explicitly out of scope per `new_sym_parts.md`. Also: dual VAT-in/ex price display, multi-currency selector, live chat, all present down to the deepest page.

**4. Backlinks/authority** — inconclusive, stated honestly rather than guessed. No Moz/Bing/DataForSEO configured; Common Crawl's free tier had no referring-domain data for any of the four domains (ours: in-crawl but below ranking threshold; the other three: not in this crawl release at all — verified, not a lookup error). Per the skill's own rule, no misleading score was produced. Only real signal: `bike-parts-sym.com` registered 2019-09-27 (RDAP) — an established domain, but one data point, not proof of link advantage. `.com.au` WHOIS doesn't expose creation dates, so no comparable age data for the other three. A real comparison needs a Moz signup (`/seo backlinks setup`).

## Still open

- Proper rank tracking once the catalogue has had weeks to index.
- Backlink data, pending a Moz/Bing signup.
- Competitor Core Web Vitals — untouched.
- Whether legacy `/sym-crox-50`-style URLs keep outranking the new catalogue once both are indexed — not yet worth checking.
