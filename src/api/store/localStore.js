/**
 * Demo data store — localStorage-backed CRUD, scoped per user.
 * Exposes the same entity surface the HTTP store will (list/filter/get/
 * create/bulkCreate/update/delete), so pages don't care which backend is live.
 * Records carry built-in fields: id, user_id, created_date, updated_date.
 */
import { getCurrentUserId } from '@/api/session';

const PREFIX = 'safemeds_db';
const keyFor = (entity) => `${PREFIX}:${entity}`;

function readAll(entity) {
  try {
    return JSON.parse(localStorage.getItem(keyFor(entity))) || [];
  } catch {
    return [];
  }
}
function writeAll(entity, rows) {
  try {
    localStorage.setItem(keyFor(entity), JSON.stringify(rows));
  } catch {
    /* quota / unavailable — ignore in demo */
  }
}
function uid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}
const nowISO = () => new Date().toISOString();

function applySort(rows, sort) {
  if (!sort) return rows;
  const desc = sort.startsWith('-');
  const field = desc ? sort.slice(1) : sort;
  return [...rows].sort((a, b) => {
    const av = a[field];
    const bv = b[field];
    if (av === bv) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    const cmp = av > bv ? 1 : -1;
    return desc ? -cmp : cmp;
  });
}
const matches = (row, query) =>
  Object.entries(query || {}).every(([k, v]) => row[k] === v);

export function createLocalEntity(entity) {
  const scoped = () => readAll(entity).filter((r) => r.user_id === getCurrentUserId());

  return {
    async list(sort = '-created_date', limit) {
      const rows = applySort(scoped(), sort);
      return limit ? rows.slice(0, limit) : rows;
    },
    async filter(query, sort = '-created_date', limit) {
      const rows = applySort(scoped().filter((r) => matches(r, query)), sort);
      return limit ? rows.slice(0, limit) : rows;
    },
    async get(id) {
      return scoped().find((r) => r.id === id) || null;
    },
    async create(data) {
      const all = readAll(entity);
      const row = {
        id: uid(),
        user_id: getCurrentUserId(),
        created_date: nowISO(),
        updated_date: nowISO(),
        ...data
      };
      all.push(row);
      writeAll(entity, all);
      return row;
    },
    async bulkCreate(items) {
      const all = readAll(entity);
      const created = items.map((data) => ({
        id: uid(),
        user_id: getCurrentUserId(),
        created_date: nowISO(),
        updated_date: nowISO(),
        ...data
      }));
      all.push(...created);
      writeAll(entity, all);
      return created;
    },
    async update(id, patch) {
      const all = readAll(entity);
      const i = all.findIndex((r) => r.id === id && r.user_id === getCurrentUserId());
      if (i < 0) return null;
      all[i] = { ...all[i], ...patch, updated_date: nowISO() };
      writeAll(entity, all);
      return all[i];
    },
    async delete(id) {
      const all = readAll(entity);
      writeAll(entity, all.filter((r) => !(r.id === id && r.user_id === getCurrentUserId())));
      return { id };
    }
  };
}
