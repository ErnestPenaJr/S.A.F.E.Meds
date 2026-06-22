/**
 * Real backend store (used once Neon + Netlify Functions are live, i.e. when
 * VITE_STACK_PROJECT_ID is set). Same surface as the local store. The matching
 * functions under netlify/functions/ are built when the DB is connected.
 */
import { api } from '@/api/client';

export function createHttpEntity(entity) {
  const base = `/${entity}`;
  const qs = (obj) => {
    const p = new URLSearchParams();
    Object.entries(obj).forEach(([k, v]) => {
      if (v != null) p.set(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
    });
    const s = p.toString();
    return s ? `?${s}` : '';
  };
  return {
    list: (sort = '-created_date', limit) => api.get(`${base}${qs({ sort, limit })}`),
    filter: (query, sort = '-created_date', limit) =>
      api.get(`${base}${qs({ where: query, sort, limit })}`),
    get: (id) => api.get(`${base}/${id}`),
    create: (data) => api.post(base, data),
    bulkCreate: (items) => api.post(`${base}/bulk`, { items }),
    update: (id, patch) => api.patch(`${base}/${id}`, patch),
    delete: (id) => api.del(`${base}/${id}`)
  };
}
