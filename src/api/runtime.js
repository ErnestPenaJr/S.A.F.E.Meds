/**
 * Whether the client talks to the live backend (Netlify Functions + Neon) or
 * the demo localStorage store. `VITE_USE_API=true` turns on the real backend
 * even before Stack auth is configured; setting VITE_STACK_PROJECT_ID implies it.
 */
export const USE_API =
  import.meta.env.VITE_USE_API === 'true' || Boolean(import.meta.env.VITE_STACK_PROJECT_ID);
