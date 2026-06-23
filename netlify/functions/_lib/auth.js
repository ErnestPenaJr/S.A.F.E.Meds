/**
 * Resolve the requesting user id from the Authorization header.
 *
 * Today the client sends `Bearer stub:<userId>` (demo auth), which we trust for
 * single-user dev/demo. When Neon Auth (Stack) is wired, real requests carry a
 * Stack JWT — verify it with STACK_SECRET_SERVER_KEY here and return its subject.
 * Until that's in place, non-stub tokens are rejected.
 */
export function getUserId(req) {
  const header = req.headers.get('authorization') || '';
  const token = header.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  if (token.startsWith('stub:')) return token.slice(5) || null;
  // TODO: verify Stack JWT (STACK_SECRET_SERVER_KEY) and return the user id.
  return null;
}
