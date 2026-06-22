# Deploying S.A.F.E Meds to Netlify

## 1. Deploy the demo (works today, no keys)

The app is fully functional in **demo mode** — data in the browser (localStorage), stubbed sign-in, and mock AI interaction analysis. To put it online:

1. Push is already on GitHub (`ErnestPenaJr/S.A.F.E.Meds`).
2. In Netlify: **Add new site → Import from GitHub → pick this repo.**
3. Netlify reads `netlify.toml` automatically:
   - build command `npm run build`, publish `dist`, functions `netlify/functions`
   - SPA + `/api/*` redirects are preconfigured.
4. Deploy. You get a working `*.netlify.app` demo (installable PWA, all features clickable).

Nothing else is required for the demo.

## 2. Go live (real database, auth, AI)

Production needs three services wired in. **Order matters** — see the caveat at the end.

### Database — Netlify DB (Neon)
```bash
npm i -g netlify-cli
netlify link                 # link this repo to the Netlify site
netlify db init              # provisions Neon, injects NETLIFY_DATABASE_URL
```
Claim the database into a free Neon account, then run migrations (paste the connection string into a local `.env` as `NETLIFY_DATABASE_URL`):
```bash
npm run db:migrate
```

### Auth — Neon Auth (Stack)
Enable Neon Auth on the Neon project, then set these env vars in Netlify:
| Var | Where |
|---|---|
| `VITE_STACK_PROJECT_ID` | client (build) |
| `VITE_STACK_PUBLISHABLE_CLIENT_KEY` | client (build) |
| `STACK_SECRET_SERVER_KEY` | functions only |

Then implement the real session in `src/lib/AuthContext.jsx` (the exact wiring is documented in that file's header comment).

### AI — Anthropic
Set `ANTHROPIC_API_KEY` in Netlify (functions only). The `/api/analyze-interactions` function (Claude `claude-opus-4-8`) goes live automatically.

## ⚠️ Caveat: build the data API before flipping the switch

Setting `VITE_STACK_PROJECT_ID` flips the client's data layer from the demo localStorage store to the **HTTP store** (`src/api/store/httpStore.js`), which calls `/api/<entity>` Netlify Functions. **Those per-entity data functions are not built yet** — only the AI function exists. So the remaining production work is:

1. Implement `netlify/functions/<entity>.js` for `medications`, `medication_schedules`, `drug_interactions`, `pharmacies`, `emergency_contacts`, `shared_lists` — each verifying the Stack session and scoping every query by `user_id` (Drizzle schema is in `src/db/schema.js`).
2. Run `db:migrate`, set the env vars, then set `VITE_STACK_PROJECT_ID` to flip the client over.

Until then, deploy in demo mode (don't set `VITE_STACK_PROJECT_ID`) — the app is fully usable.

## Env var summary
See `.env.example`. `VITE_*` are exposed to the browser (publishable only); `STACK_SECRET_SERVER_KEY` and `ANTHROPIC_API_KEY` are function-only — never client-side.
