/**
 * Built-in email/password auth. Endpoints:
 *   POST /api/auth/signup  { email, password, full_name } → { token, user }
 *   POST /api/auth/login   { email, password }            → { token, user }
 *   GET  /api/auth/me      (Bearer token)                 → { user }
 * Passwords hashed with scrypt; sessions are HS256 JWTs signed with AUTH_JWT_SECRET.
 */
import { eq } from 'drizzle-orm';
import { getDb } from './_lib/db.js';
import { users } from '../../src/db/schema.js';
import { hashPassword, verifyPassword } from './_lib/password.js';
import { signJWT } from './_lib/jwt.js';
import { getUserId } from './_lib/auth.js';

const json = (data, status = 200) => Response.json(data, { status });
const TOKEN_TTL = 60 * 60 * 24 * 30; // 30 days
const publicUser = (u) => ({ id: u.id, email: u.email, full_name: u.full_name });

export default async function handler(req) {
  const action = new URL(req.url).pathname.split('/').filter(Boolean).pop(); // signup | login | me
  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret) return json({ error: 'Auth is not configured (AUTH_JWT_SECRET missing).' }, 500);

  let db;
  try {
    db = getDb();
  } catch (e) {
    return json({ error: String(e?.message || e) }, 500);
  }

  try {
    if (req.method === 'POST' && action === 'signup') {
      const { email, password, full_name } = await req.json();
      const em = (email || '').trim().toLowerCase();
      if (!em || !password || password.length < 8) {
        return json({ error: 'Enter an email and a password of at least 8 characters.' }, 400);
      }
      const existing = await db.select().from(users).where(eq(users.email, em));
      if (existing.length) return json({ error: 'An account with that email already exists.' }, 409);
      const [u] = await db
        .insert(users)
        .values({ email: em, password_hash: hashPassword(password), full_name: full_name?.trim() || null })
        .returning();
      return json({ token: signJWT({ sub: u.id, email: u.email }, secret, TOKEN_TTL), user: publicUser(u) });
    }

    if (req.method === 'POST' && action === 'login') {
      const { email, password } = await req.json();
      const em = (email || '').trim().toLowerCase();
      const rows = await db.select().from(users).where(eq(users.email, em));
      const u = rows[0];
      if (!u || !verifyPassword(password || '', u.password_hash)) {
        return json({ error: 'Invalid email or password.' }, 401);
      }
      return json({ token: signJWT({ sub: u.id, email: u.email }, secret, TOKEN_TTL), user: publicUser(u) });
    }

    if (req.method === 'GET' && action === 'me') {
      const uid = getUserId(req);
      if (!uid) return json({ error: 'unauthorized' }, 401);
      const rows = await db.select().from(users).where(eq(users.id, uid));
      if (!rows[0]) return json({ error: 'unauthorized' }, 401);
      return json({ user: publicUser(rows[0]) });
    }

    return json({ error: 'not_found' }, 404);
  } catch (err) {
    return json({ error: String(err?.message || err) }, 500);
  }
}

export const config = { path: ['/api/auth/signup', '/api/auth/login', '/api/auth/me'] };
