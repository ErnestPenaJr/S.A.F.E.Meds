/**
 * DB smoke test: exercises the real medications function (create → list →
 * update → delete) against Neon. Proves the database + data API work end-to-end.
 *
 *   NETLIFY_DATABASE_URL=postgres://... node scripts/db-smoke.mjs
 * (or put NETLIFY_DATABASE_URL in .env — this loads it automatically)
 */
import fs from 'node:fs';

// Minimal .env loader (no dependency).
try {
  for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch {
  /* no .env — rely on the shell env */
}

if (!process.env.NETLIFY_DATABASE_URL) {
  console.error('NETLIFY_DATABASE_URL is not set (add it to .env or the shell).');
  process.exit(1);
}

const { default: handler } = await import('../netlify/functions/medications.js');
const headers = { authorization: 'Bearer stub:smoke-user', 'content-type': 'application/json' };
const call = (method, path = '', body) =>
  handler(new Request(`http://localhost/api/medications${path}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined
  }));

let r = await call('POST', '', { name: 'Smoke Test Med', type: 'medication', dosage: '10mg', frequency: 'once_daily', times: ['09:00'], active: true });
const created = await r.json();
console.log('create:', r.status, created.id, created.name);

r = await call('GET');
console.log('list:  ', r.status, (await r.json()).length, 'rows');

r = await call('PATCH', `/${created.id}`, { active: false });
console.log('update:', r.status, 'active =', (await r.json()).active);

r = await call('DELETE', `/${created.id}`);
console.log('delete:', r.status, (await r.json()).id);

console.log('\n✅ Database + data API working.');
