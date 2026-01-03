# Copilot Instructions — PPI Dashboard

## Project overview
- Vite + React + TypeScript app focused on a Political Pressure Index (PPI) visualization.
- Core UI lives in `src/App.tsx` and uses inline `styles` objects for layout/visuals.
- Charts are built with Recharts; demo data is in `DATA` and `EVENTS` in `src/App.tsx`.
- The scoring model and data-shaping rules are defined in `PPI_FRAMEWORK.md` and must be followed when adding real scoring logic.

## Key constraints
- Keep the PPI scoring function **pure** (no I/O inside it).
- Every input variable must have: name, unit, directionality, and default.
- Missing data must follow the deterministic fallback strategy described in `PPI_FRAMEWORK.md`.
- Output must include a human-readable `explain` list and `missingDataFlags` when fallbacks are used.

## Code style
- TypeScript, React functional components.
- Prefer small, readable helpers over new abstractions.
- Inline styles are currently preferred for layout and component styling in `src/App.tsx`.
- Use ASCII in files unless the file already contains non-ASCII.

## Frontend layout expectations
- App should fill the viewport and keep main content centered.
- Avoid hard-coded left alignment or container max-width constraints unless intentional.
- Ensure responsive behavior on mobile and desktop.

## When editing
- Update `src/App.tsx` first for UI changes.
- Use `src/index.css` and `src/App.css` only for global/layout resets.
- If adding real scoring logic, define types and functions near the data model and keep them testable.

## Testing
- If you add scoring logic, add lightweight tests for:
  - Score clamping to `0..100`
  - Zone boundaries
  - Missing data fallback
  - AI cone ordering (`low <= base <= high` after 2022)
