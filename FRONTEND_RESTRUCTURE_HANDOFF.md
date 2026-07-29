# Frontend restructure — handoff

**Branch:** `feature/sym-parts-platform`
**Status:** moves and automated verification complete; visual check and commit pending
**Nothing is committed.** All changes are staged/working-tree only (user commits their own work).

---

## The rule being applied

> **A module lives at the nearest common ancestor of everything that imports it.**

- One consumer → colocate in that route (`_components/` for `.tsx`, `_lib/` for `.ts`).
- Consumers across sibling routes → hoist to their shared parent route.
- Consumers spanning unrelated trees → stays top-level (shared).

This is Next.js's "split project files by feature or route" strategy
(`node_modules/next/dist/docs/01-app/01-getting-started/02-project-structure.md:352`).
Next is explicitly unopinionated here; the doc's actual guidance is *pick one strategy and be
consistent*. The repo was previously running all three strategies at once, which is what made
things feel scattered.

## Target shape (now achieved)

```
frontend/
  app/          routes + colocated _components/ and _lib/
  components/   shared UI only (+ components/ui = vendored shadcn primitives)
  lib/          shared non-UI code
  types/        shared domain types
  content/      markdown data (read via process.cwd())
  proxy.ts      must stay at root (Next file convention)
```

---

## What was done

### Method
Built an importer census (`scratchpad/census.py`) that resolves **every** import specifier —
static, `import type`, and `dynamic(() => import(...))` — for both `@/` alias and relative
forms, then computes each module's nearest common ancestor.

> An earlier grep-based census was wrong: it missed `dynamic()` imports and relative imports,
> and falsely flagged 4 live files as dead. Do not trust grep for this — use `census.py`.

Moves were executed by `scratchpad/move.py`, which rewrites importers' specifiers (preserving
alias-vs-relative form) and `git mv`s the file. Passes were run **iteratively to a fixed point**,
because each round unlocks transitive moves (e.g. `lib/bookingStatus.ts` only became
service-diary-only once `forms/BookingForm.tsx` moved there).

### Pass 0 — dead code (9 files deleted)
`components/BannerV2.tsx`, `components/Breadcrumb.tsx`, `components/FooterAuthLinks.tsx`,
`components/WorkshopJobTypes.tsx`, `components/ui/tooltip.tsx`, `lib/pageModified.ts`,
then the cascade: `types/BreadcrumbProps.ts`, `types/WorkshopJobTypesProps.ts`.
Also deleted `utils/utils.ts` — it was a **byte-identical duplicate** of `lib/utils.ts` (`cn()`);
its one consumer (`LoginForm`) was repointed at `lib/utils`.

### Passes 1–3 — module moves to fixed point (56 files)
All single-route modules moved out of `lib/`, `utils/`, `services/`, `forms/`, `data/`,
`context/`, `hooks/`, and `components/` into the owning route. Highlights:

| From | To |
|---|---|
| `forms/*` (all 8 — each had exactly 1 consumer) | their consuming routes |
| `lib/partsCheckoutApi.ts` (6 importers) | `app/parts/checkout/_lib/` |
| `lib/inventoryList.ts`, `components/BikeListPage.tsx` | `app/inventory/` |
| `services/partsAdminService.ts` | `app/dashboard/parts-orders/_lib/` |
| `context/PartsCartContext.tsx` | `app/parts/_components/` |
| `context/AuthContext.tsx` | `app/dashboard/_components/` |
| `lib/bookingStatus.ts` | `app/dashboard/service-diary/_lib/` |
| `lib/hire.ts` | `app/hire/_lib/` |
| `components/parts/*`, `components/admin/*` | their routes (both dirs now gone) |

### Pass 4 — types (`types/` went 60 → 26 files)
- **23 single-consumer type files inlined** into their consuming component
  (`scratchpad/inline.py` — merges the type file's imports, dedupes against existing
  imports, deletes the file). A props interface used by exactly one component is part of that
  component's definition.
- **11 route-scoped types moved** into route `_lib/` (`partsAdmin.ts`, `JobType.ts`,
  `CheckoutFormData.ts`, `Specification.ts`, etc.).
- 26 genuinely shared domain types remain in `types/` (`Bike.ts` n=32, `HireBooking.ts` n=18,
  `Product.ts` n=17, …).

### Pass 5 — bucket collapse
Eleven top-level buckets reduced to three. `utils/`, `hooks/`, `services/`, `config/` and
root `api.ts` / `apiClient.ts` → `lib/`. `forms/` → emptied into routes + `components/`.
`data/`, `context/` → emptied and removed.

### Pass 6 — app/ stragglers
`app/dashboard/AdminLayout.tsx` → `app/dashboard/_components/`,
`app/parts/PartsShell.tsx` → `app/parts/_components/`.

**Totals:** 32 deletions, 77 renames, 123 modified files.

---

## Two deliberate exclusions from the rule

These are cross-cutting infrastructure where the mechanical rule gives the wrong answer.
Both are currently dashboard-only, so the census *wants* to move them:

1. **`components/ui/**`** — the vendored shadcn primitive layer. The shadcn CLI expects
   `components/ui/dialog` at that exact path; moving it breaks any future `shadcn add`.
   (Affects `dialog`, `table`, `switch`, `detail-row`, `pagination-bar`, `status-badge`.)
2. **`lib/formatting.ts`** — the app's canonical date/currency rendering, built on
   `SITE_TIMEZONE`. Parking it under `app/dashboard/_lib` would mean the public site imports
   dashboard code the first time it formats a date.

`move.py` hard-filters `components/ui/`; `formatting.ts` was dropped from each plan via
`drop.py`. **If you re-run the loop, keep both exclusions.**

---

## What is left to do

1. **Visual check** — user does their own visual inspection; do not use Claude-in-Chrome.
2. Commit the work (the user handles commits).
3. Delete this handoff file once the visual check is complete and the work is committed.

### Verification already done
`npx tsc --noEmit` was run after **every** pass and is **clean (exit 0)**, including after the
final straggler move.

Final verification on 2026-07-29:

- `npx eslint app components lib --quiet` — clean (exit 0). Fifteen pre-existing lint errors
  exposed by the moved files were fixed with behavior-preserving type narrowing and JSX entity
  encoding.
- `npx next build` — clean (exit 0), including TypeScript, page-data collection, and all 61
  static pages.
- `python -m pytest parts payments notifications service -q` — 408 passed, 8 skipped.
- `git diff --check` — clean (exit 0).

---

## Scripts (regenerate if context is lost)

In `C:\Users\ethan\AppData\Local\Temp\claude\C--Users-ethan-coding-allbikes\80b7aac6-c529-4437-b503-2dbc84eb79d1\scratchpad\`:

- `census.py <out.json>` — importer census + nearest common ancestor. `SRC_DIRS` is now
  `["app","components","lib","types"]`.
- `plan.py <moves.json>` — turns the census into a move plan.
- `drop.py <moves.json> <path>...` — removes entries from a plan.
- `move.py <moves.json>` — rewrites imports and `git mv`s.
- `inline.py <pairs.json>` — inlines a type file into its single consumer.

Loop to fixed point: `census → plan → drop utils/formatting.ts → move`, repeat until
`move.py` prints `no moves`.

### Known rough edges in the scripts
- `inline.py` removes the consumer's import of the inlined file only in `@/alias` form. Two
  files (`types/Bike.ts`, `types/Product.ts`) imported relatively and needed their stale
  first line deleted by hand. Watch for this if inlining more.
- `plan.py`'s `TOP` tuple must include `"types/"` (it was added mid-task).

## User constraints in force
- Do not use Claude-in-Chrome.
- Do not commit or otherwise run git write commands beyond the `git mv`/`git rm` these moves
  require — the user handles commits.
