/** Minimal HS256 JWT sign/verify using node:crypto (no external dependency). */
import crypto from 'node:crypto';

const b64urlJSON = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');

export function signJWT(payload, secret, expiresInSec = 60 * 60 * 24 * 30) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const body = { ...payload, iat: now, exp: now + expiresInSec };
  const data = `${b64urlJSON(header)}.${b64urlJSON(body)}`;
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${sig}`;
}

export function verifyJWT(token, secret) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const data = `${parts[0]}.${parts[1]}`;
  const expected = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  const got = Buffer.from(parts[2]);
  const exp = Buffer.from(expected);
  if (got.length !== exp.length || !crypto.timingSafeEqual(got, exp)) return null;
  let payload;
  try {
    payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) return null;
  return payload;
}
