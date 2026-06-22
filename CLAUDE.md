# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**S.A.F.E Meds** — a mobile-first PWA for managing medications, supplements, vitamins, herbals, and **peptides** (track doses, schedules, adherence, drug interactions, pharmacies, sharing, emergency card).

This was originally built on the **Base44** BaaS platform; it is being **rebuilt from scratch** to self-own the stack and deploy to **Netlify**. `safemeds_Inst.md` is the original Base44 recreation spec — treat it as the **feature/behavior reference** (data model, pages, UX, AI prompts), **not** the current architecture. Where this file and the spec disagree on *architecture* (backend, auth, AI, hosting), **this file wins**; for *what a feature should do*, the spec is the source of truth.

## Stack (current, post-migration)

| Concern | Choice |
|---|---|
| Frontend | React 19 + Vite, react-router-dom v7, @tanstack/react-query |
| Styling | Tailwind **v3** + shadcn/ui (Radix), CSS-variable design tokens |
| Data | **Netlify DB (Neon Postgres)** via **Drizzle ORM** |
| Auth | **Neon Auth (Stack Auth)** — users sync into `neon_auth.users_sync` |
| Backend | **Netlify Functions** (the data API + AI proxy) under `/api/*` |
| AI / external | Claude (interaction analysis, education, smart schedule) · RxNorm/openFDA (med search) · geo + Leaflet/OSM (pharmacy) |
| Delivery | Netlify hosting + installable **PWA** (vite-plugin-pwa) |

`@base44/sdk`, Stripe, and the subscription paywall from the spec are **dropped** for v1.

## Commands

```bash
npm run dev          # Vite dev server (http://localhost:5173)
npm run build        # Production build -> dist/
npm run preview      # Preview the production build

npm run db:generate  # Generate SQL migration from src/db/schema.js (no DB needed)
npm run db:migrate   # Apply migrations (needs NETLIFY_DATABASE_URL)
npm run db:push      # Push schema directly to the DB (dev convenience)
npm run db:studio    # Drizzle Studio
```

No test runner or linter is configured yet. Don't add one unless asked.

## Architecture — the load-bearing ideas

**The browser never touches Postgres.** Data flows `React → fetch('/api/...') → Netlify Function → Neon`. `netlify.toml` redirects `/api/*` to `/.netlify/functions/*`. The frontend calls the API through the facade in `src/api/client.js` (`api.get/post/patch/del`); functions live in `netlify/functions/`. When adding a data feature you write *both* sides: a function that queries Neon (scoped by user) and a client call.

**Per-user isolation is enforced in the API, not the client.** Every table carries a `user_id` (= the Stack Auth user id, which mirrors `neon_auth.users_sync.id`). Each function must verify the Stack session token and filter every query by that `user_id`. There is no Supabase-style client-side RLS — if a function forgets to scope by `user_id`, data leaks. (Postgres RLS can be layered on later since Neon Auth is RLS-ready.)

**Theming is a first-class, swappable token system.** All four design directions (`vital`, `after-dark`, `bento`, `clear`) are real user-selectable themes, persisted to `profiles.theme`. They are driven by CSS variables in `src/index.css`: `:root` holds the default (Vital); each other theme overrides the same vars under `[data-theme="..."]`. Components read the vars (via Tailwind tokens like `bg-primary`, `text-foreground`) and never hardcode hex — so flipping the `data-theme` attribute reskins the whole app. Themes also differ in **layout** (a per-theme dashboard "hero variant": banner / ring / tiles / big-action), not just color. The peptide accent (`--peptide`, violet) stays consistent across all themes.

**Routing is registry-driven.** `src/pages.config.js` exports `PAGES` (name → component) and `mainPage`. `src/App.jsx` maps each entry to a route via `createPageUrl(name)` from `src/utils/index.js` (`"Add Medication"` → `/add-medication`), with `mainPage` at `/`. To add a page: create `src/pages/<Name>.jsx` (default export) and register it in `pages.config.js` — don't hand-edit the `Routes` block. Build URLs with `createPageUrl`, never hardcoded strings.

## Data model

Defined in `src/db/schema.js` (Drizzle): `profiles`, `medications`, `medication_schedules`, `drug_interactions`, `pharmacies`, `emergency_contacts`, `shared_lists`. The `medications` table extends the spec's fields with **peptide support**: `vial_amount_mg` + `bac_water_ml` → `concentration_mcg_per_ml`, `dose_amount` + `dose_unit` (mg/mcg/IU/mL), `injection_route`, `injection_sites[]` (rotation), and `cycle_weeks_on/off` + `cycle_start_date` (→ "Day X of Y"). `med_type` enum includes `peptide`. After editing the schema, run `npm run db:generate` and commit the new file under `drizzle/`.

## Conventions

- `@` import alias → `src/` (configured in `vite.config.js` + `jsconfig.json`).
- Pages/components are **default exports named identically to the file**.
- `cn()` from `src/lib/utils.js` for class merging (shadcn convention).
- Tailwind classes must be **literal strings** (dynamic `bg-${x}` is purged).
- Mobile-first: design for the phone first; nav is a bottom bar (see `src/Layout.jsx`), not the spec's desktop sidebar. Use `pt-safe`/`pb-safe`/`min-h-dvh` utilities for notches.
- Health/drug guidance must carry a "not medical advice" disclaimer.

## Secrets / env (`.env`, never committed — see `.env.example`)

`NETLIFY_DATABASE_URL` (Neon) · `VITE_STACK_PROJECT_ID` + `VITE_STACK_PUBLISHABLE_CLIENT_KEY` (client) · `STACK_SECRET_SERVER_KEY` (functions only) · `ANTHROPIC_API_KEY` (functions only). `VITE_*` vars are exposed to the browser — only publishable values go there.

## Status

**Phase 0 (scaffold) complete.** App boots and builds; routing, theme-token base, Drizzle schema + first migration, Netlify config + `/api/health` function, and PWA are wired. Pages are placeholders (`src/components/common/PagePlaceholder.jsx`); `src/Layout.jsx` is a temporary shell. Phases: 1 = shell/themes/auth, 2 = core meds+schedule, 3 = interactions, 4 = pharmacy, 5 = sharing+emergency card, 6 = polish+deploy. See the task list.
