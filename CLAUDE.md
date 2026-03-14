# Claude Code Rules

## Session Start

At the start of every session, read `C:\Users\ethan\coding\allbikes\README.md` for a project overview. Refer to `C:\Users\ethan\coding\allbikes\_docs` for documentation where needed.

## Rules

### Colors
Where reasonable, always use colors defined in `frontend/src/index.css` rather than inline Tailwind color classes (e.g. `text-[var(--highlight)]` not `text-amber-400`). When writing new components or editing existing ones, check the CSS file first for an appropriate variable before reaching for a raw Tailwind color.
