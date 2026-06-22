import { defineConfig } from 'drizzle-kit';

// NETLIFY_DATABASE_URL is injected by `netlify db init` (Neon).
// For local migrations, paste your Neon connection string into .env.
export default defineConfig({
  schema: './src/db/schema.js',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL || ''
  },
  verbose: true,
  strict: true
});
