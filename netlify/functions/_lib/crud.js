/**
 * Generic per-user CRUD handler over a Drizzle table, matching the client's
 * httpStore contract:
 *   GET    /api/<entity>?sort=&limit=&where=<json>   → list / filter
 *   GET    /api/<entity>/<id>                         → one row
 *   POST   /api/<entity>                              → create
 *   POST   /api/<entity>/bulk                         → bulk create
 *   PATCH  /api/<entity>/<id>                         → update
 *   DELETE /api/<entity>/<id>                         → delete
 * Every query is scoped to the authenticated user_id.
 */
import { getTableColumns, eq, and, asc, desc } from 'drizzle-orm';
import { getDb } from './db.js';
import { getUserId } from './auth.js';

const json = (data, status = 200) => Response.json(data, { status });
const SYSTEM_FIELDS = new Set(['id', 'user_id', 'created_date', 'updated_date']);

export function createCrudHandler(table, route) {
  const columns = getTableColumns(table);
  const colNames = new Set(Object.keys(columns));

  const sanitize = (obj, { forCreate }) => {
    const out = {};
    for (const [k, v] of Object.entries(obj || {})) {
      if (!colNames.has(k)) continue;
      if (forCreate && SYSTEM_FIELDS.has(k)) continue;
      if (!forCreate && (k === 'id' || k === 'user_id' || k === 'created_date')) continue;
      out[k] = v;
    }
    return out;
  };

  return async function handler(req) {
    const uid = getUserId(req);
    if (!uid) return json({ error: 'unauthorized' }, 401);

    const db = getDb();
    const url = new URL(req.url);
    const parts = url.pathname.split('/').filter(Boolean);
    const idx = parts.indexOf(route);
    const rest = idx >= 0 ? parts.slice(idx + 1).join('/') : '';
    const method = req.method;

    try {
      if (method === 'GET' && !rest) {
        const conds = [eq(table.user_id, uid)];
        const whereRaw = url.searchParams.get('where');
        if (whereRaw) {
          const w = JSON.parse(whereRaw);
          for (const [k, v] of Object.entries(w)) {
            if (colNames.has(k)) conds.push(eq(table[k], v));
          }
        }
        let q = db.select().from(table).where(and(...conds));
        const sort = url.searchParams.get('sort') || '-created_date';
        const isDesc = sort.startsWith('-');
        const field = isDesc ? sort.slice(1) : sort;
        if (colNames.has(field)) q = q.orderBy(isDesc ? desc(table[field]) : asc(table[field]));
        const limit = url.searchParams.get('limit');
        if (limit) q = q.limit(Number(limit));
        return json(await q);
      }

      if (method === 'GET' && rest) {
        const rows = await db.select().from(table).where(and(eq(table.id, rest), eq(table.user_id, uid)));
        return json(rows[0] || null);
      }

      if (method === 'POST' && rest === 'bulk') {
        const { items = [] } = await req.json();
        if (!items.length) return json([]);
        const values = items.map((it) => ({ ...sanitize(it, { forCreate: true }), user_id: uid }));
        return json(await db.insert(table).values(values).returning());
      }

      if (method === 'POST' && !rest) {
        const body = await req.json();
        const [row] = await db.insert(table).values({ ...sanitize(body, { forCreate: true }), user_id: uid }).returning();
        return json(row);
      }

      if (method === 'PATCH' && rest) {
        const body = await req.json();
        const patch = { ...sanitize(body, { forCreate: false }), updated_date: new Date().toISOString() };
        const [row] = await db.update(table).set(patch).where(and(eq(table.id, rest), eq(table.user_id, uid))).returning();
        return json(row || null);
      }

      if (method === 'DELETE' && rest) {
        await db.delete(table).where(and(eq(table.id, rest), eq(table.user_id, uid)));
        return json({ id: rest });
      }

      return json({ error: 'not_found' }, 404);
    } catch (err) {
      return json({ error: String(err?.message || err) }, 500);
    }
  };
}
