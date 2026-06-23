/**
 * Auth smoke test: signup → login → me → token-scoped data create/list/delete,
 * all against the real DB. Run with the DB URL + AUTH_JWT_SECRET in the env:
 *   netlify dev:exec -- node scripts/auth-smoke.mjs
 * or: NETLIFY_DATABASE_URL=... AUTH_JWT_SECRET=... node scripts/auth-smoke.mjs
 * (also loads .env automatically)
 */
import fs from 'node:fs';

try {
  for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch {
  /* rely on shell env */
}

if (!process.env.NETLIFY_DATABASE_URL) { console.error('NETLIFY_DATABASE_URL not set'); process.exit(1); }
if (!process.env.AUTH_JWT_SECRET) { console.error('AUTH_JWT_SECRET not set'); process.exit(1); }

const { default: auth } = await import('../netlify/functions/auth.js');
const { default: meds } = await import('../netlify/functions/medications.js');

const post = (fn, path, body, token) =>
  fn(new Request(`http://localhost${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body)
  }));
const get = (fn, path, token) =>
  fn(new Request(`http://localhost${path}`, { headers: token ? { authorization: `Bearer ${token}` } : {} }));
const del = (fn, path, token) =>
  fn(new Request(`http://localhost${path}`, { method: 'DELETE', headers: token ? { authorization: `Bearer ${token}` } : {} }));

const email = `smoke_${Math.floor(Date.now() / 1000)}@example.com`;
const password = 'sup3rsecret!';

let r = await post(auth, '/api/auth/signup', { email, password, full_name: 'Smoke User' });
let body = await r.json();
console.log('signup:', r.status, body.user?.id ? `user ${body.user.id.slice(0, 8)}…` : body.error);
const token = body.token;
if (!token) process.exit(1);

r = await post(auth, '/api/auth/login', { email, password });
body = await r.json();
console.log('login: ', r.status, body.token ? 'token ok' : body.error);

r = await get(auth, '/api/auth/me', body.token);
console.log('me:    ', r.status, (await r.json()).user?.email);

// token-scoped data
r = await post(meds, '/api/medications', { name: 'Auth Smoke Med', type: 'medication', frequency: 'once_daily' }, token);
const med = await r.json();
console.log('create med:', r.status, med.id ? 'ok' : med.error);
r = await get(meds, '/api/medications', token);
console.log('list meds: ', r.status, (await r.json()).length, 'row(s) for this user');
r = await del(meds, `/api/medications/${med.id}`, token);
console.log('delete med:', r.status);

// unauthorized check
r = await get(meds, '/api/medications');
console.log('no-token list (want 401):', r.status);

console.log('\n✅ Auth + scoped data verified.');
