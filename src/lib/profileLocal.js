/** Lightweight per-user profile bits (allergies) for demo mode. */
import { getCurrentUserId } from '@/api/session';

const keyFor = () => `safemeds_profile:${getCurrentUserId()}`;

export function getProfileLocal() {
  try {
    return JSON.parse(localStorage.getItem(keyFor())) || {};
  } catch {
    return {};
  }
}

export function setProfileLocal(patch) {
  const next = { ...getProfileLocal(), ...patch };
  try {
    localStorage.setItem(keyFor(), JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}
