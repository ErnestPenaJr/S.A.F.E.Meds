/**
 * Resolve the requesting user id from a Bearer JWT (issued by /api/auth/*).
 * Verified with AUTH_JWT_SECRET. Returns the user id (sub) or null.
 */
import { verifyJWT } from './jwt.js';

export function getUserId(req) {
  const header = req.headers.get('authorization') || '';
  const token = header.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret) return null;
  const payload = verifyJWT(token, secret);
  return payload?.sub || null;
}
