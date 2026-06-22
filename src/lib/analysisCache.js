/** Caches the last analysis's food + safety results (per user) for the UI. */
import { getCurrentUserId } from '@/api/session';

const keyFor = () => `safemeds_analysis:${getCurrentUserId()}`;

export function getAnalysisCache() {
  try {
    return JSON.parse(localStorage.getItem(keyFor())) || null;
  } catch {
    return null;
  }
}

export function saveAnalysisCache(value) {
  try {
    localStorage.setItem(keyFor(), JSON.stringify(value));
  } catch {
    /* ignore */
  }
}
