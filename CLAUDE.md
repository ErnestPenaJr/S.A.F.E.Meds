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
| Auth | **Built-in email/password** — `users` table, scrypt hashing + HS256 JWT (`AUTH_JWT_SECRET`), all in Netlify Functions |
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

**Auth is built-in email/password.** `netlify/functions/auth.js` handles `POST /api/auth/signup` + `/login` and `GET /api/auth/me` — scrypt password hashing (`_lib/password.js`) and HS256 session JWTs (`_lib/jwt.js`, signed with `AUTH_JWT_SECRET`), no third-party provider. The client stores the JWT and sends it as `Authorization: Bearer <jwt>`; `AuthContext` exposes `signUp/signIn/signOut`. (`profiles`/`neon_auth` are not used.)

**Per-user isolation is enforced in the API, not the client.** Every table carries a `user_id` (= `users.id`). Each data function calls `getUserId(req)` (`_lib/auth.js`), which verifies the Bearer JWT and returns its `sub`; every query is filtered by that `user_id`. There is no client-side RLS — if a function forgets to scope by `user_id`, data leaks. (Postgres RLS can be layered on later.)

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

`NETLIFY_DATABASE_URL` (Neon — auto-injected on deploy by Netlify DB) · `VITE_USE_API` (`true` flips the client to the live backend; build-time) · `AUTH_JWT_SECRET` (functions only — signs session JWTs) · `ANTHROPIC_API_KEY` (functions only). `VITE_*` vars are exposed to the browser — only non-secret values go there.

## Status

**All 6 phases' app code complete** (scaffold; themes+shell+stub-auth; meds/schedule/dashboard/peptides; AI interactions; pharmacy; sharing + emergency card; PWA polish). The map route is code-split (`PharmacyMap` lazy-loaded) so the main bundle is ~125 kB gzip. Deployable to Netlify as a working **demo today** — see `DEPLOY.md`.

**Backend is built (data API + auth).** Per-entity CRUD functions exist for all six tables (`netlify/functions/<entity>.js` via a shared `_lib/crud.js` factory, scoped by `user_id`), plus `auth.js` (signup/login/me). Migrations live in `netlify/database/migrations/` (Netlify-managed; auto-applied on deploy). `src/api/store/httpStore.js` targets these; `VITE_USE_API=true` flips the client onto them.

**The one remaining gate is provisioning the DB.** Netlify DB (Neon) only provisions on a **production deploy** (`netlify deploy --build --prod`) — there's no local connection string, so end-to-end can't be verified locally. After a deploy (with `VITE_USE_API=true` + `AUTH_JWT_SECRET` set on the site, both already configured), `/api/auth/*` and the data API run against Neon. Caveat: auth scopes per `users.id`, which is real multi-user — that part is done.

Navigation: the bottom bar holds Home / Meds / **+ (log dose → AddMedication)** / Schedule / **More**; the "More" sheet (`src/Layout.jsx`) is how Interactions, Pharmacy, Share, Emergency Card, and Profile are reached. `/sharedview` renders bare (no auth, no Layout) — gated in `src/App.jsx`. Emergency Card prints via `window.print()`; app chrome carries `print:hidden`.

**Responsive (mobile-first + desktop):** below `lg` it's the mobile shell (top bar + bottom nav). At `lg+`, `src/Layout.jsx` shows a fixed left **sidebar** (full nav, "Add medication" CTA, theme, user + sign-out), hides the mobile bar/nav, and `main` widens (`lg:max-w-6xl`, `lg:pl-72`). Pages adapt at `lg`: Home → 2-col dashboard (`[380px_1fr]`), Medications → card grid (`sm:2 / xl:3`), Pharmacy → map+list side-by-side (sticky map), and form/single-column pages (AddMedication, Schedule, Interactions, EmergencyCard, Profile, Share) cap to `lg:max-w-2xl`/`3xl`. Keep both layouts working when editing a page.

Locally (`npm run dev`, no `VITE_USE_API`) the app runs in **demo mode** (localStorage data + one-tap demo sign-in + mock AI). With `VITE_USE_API=true` it uses the live backend (real email/password auth + Neon data + Claude); the AI function still needs `ANTHROPIC_API_KEY` or it returns a clear "not configured" payload.

**AI layer (Phase 3):** `src/api/ai.js` is the facade. Demo mode → `src/lib/interactionsMock.js`; live mode → `POST /api/analyze-interactions` (`netlify/functions/analyze-interactions.js`), which calls **Claude `claude-opus-4-8`** with adaptive thinking + **structured outputs** (`output_config.format` against a JSON schema) and degrades to a clear "not configured" payload when `ANTHROPIC_API_KEY` is unset. Drug-drug results persist to the `DrugInteraction` entity (acknowledge state carried across re-runs); food + safety are cached in localStorage (`src/lib/analysisCache.js`). `@anthropic-ai/sdk` is a function-only dependency — never import it under `src/` (it must not enter the client bundle).
