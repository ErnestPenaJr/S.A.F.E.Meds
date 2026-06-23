/** Drizzle client over Netlify DB (Neon), shared by all data functions. */
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

const url = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;

let _db;
export function getDb() {
  if (!url) throw new Error('NETLIFY_DATABASE_URL is not set');
  if (!_db) _db = drizzle(neon(url));
  return _db;
}
