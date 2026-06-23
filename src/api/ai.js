/**
 * AI facade for interaction analysis. Demo mode runs the local mock; live mode
 * (VITE_STACK_PROJECT_ID set) calls the Netlify function that proxies Claude.
 */
import { api } from '@/api/client';
import { mockAnalyze } from '@/lib/interactionsMock';
import { USE_API } from '@/api/runtime';

export async function analyzeInteractions(medications) {
  if (USE_API) {
    return api.post('/analyze-interactions', { medications });
  }
  // Simulate network latency for a realistic demo.
  await new Promise((r) => setTimeout(r, 700));
  return mockAnalyze(medications);
}

export const isDemoAI = !USE_API;
