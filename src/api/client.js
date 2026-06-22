/**
 * Thin client for our Netlify Functions data/AI layer.
 * The browser never talks to Postgres directly — it calls /api/* which is
 * redirected to /.netlify/functions/* (see netlify.toml). Phase 1 wires the
 * Stack Auth session token into `authToken` so functions can verify the user.
 */
let authToken = null;
export function setAuthToken(token) {
  authToken = token || null;
}

export async function apiFetch(path, { method = 'GET', body, headers } = {}) {
  const res = await fetch(`/api/${String(path).replace(/^\/+/, '')}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(authToken ? { authorization: `Bearer ${authToken}` } : {}),
      ...headers
    },
    body: body != null ? JSON.stringify(body) : undefined
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`API ${res.status} on ${path}: ${detail || res.statusText}`);
  }

  const contentType = res.headers.get('content-type') || '';
  return contentType.includes('application/json') ? res.json() : res.text();
}

export const api = {
  get: (path, opts) => apiFetch(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => apiFetch(path, { ...opts, method: 'POST', body }),
  patch: (path, body, opts) => apiFetch(path, { ...opts, method: 'PATCH', body }),
  del: (path, opts) => apiFetch(path, { ...opts, method: 'DELETE' })
};
