/**
 * Drug-interaction analysis via Claude (claude-opus-4-8), returned as
 * schema-validated JSON. Reachable at POST /api/analyze-interactions.
 *
 * If ANTHROPIC_API_KEY isn't configured, returns a clear "not configured"
 * payload so the deployed app degrades gracefully. (In demo mode the client
 * never calls this — it uses the local mock.)
 *
 * NOTE: when Neon Auth is live, verify the Stack session token from the
 * Authorization header here before processing. Informational only — the prompt
 * makes clear this is not medical advice.
 */
import Anthropic from '@anthropic-ai/sdk';

const interactionItem = {
  type: 'object',
  additionalProperties: false,
  properties: {
    medication_a_name: { type: 'string' },
    medication_b_name: { type: 'string' },
    severity: { type: 'string', enum: ['high', 'medium', 'low'] },
    confidence: { type: 'integer' },
    description: { type: 'string' },
    mechanism: { type: 'string' },
    clinical_effects: { type: 'array', items: { type: 'string' } },
    recommendations: { type: 'array', items: { type: 'string' } }
  },
  required: ['medication_a_name', 'medication_b_name', 'severity', 'confidence', 'description', 'mechanism', 'clinical_effects', 'recommendations']
};

const foodItem = {
  type: 'object',
  additionalProperties: false,
  properties: {
    medication_name: { type: 'string' },
    food: { type: 'string' },
    severity: { type: 'string', enum: ['high', 'medium', 'low'] },
    description: { type: 'string' },
    recommendation: { type: 'string' }
  },
  required: ['medication_name', 'food', 'severity', 'description', 'recommendation']
};

const safetyItem = {
  type: 'object',
  additionalProperties: false,
  properties: {
    medication_name: { type: 'string' },
    title: { type: 'string' },
    severity: { type: 'string', enum: ['high', 'medium', 'low'] },
    description: { type: 'string' }
  },
  required: ['medication_name', 'title', 'severity', 'description']
};

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    interactions: { type: 'array', items: interactionItem },
    food_interactions: { type: 'array', items: foodItem },
    safety_alerts: { type: 'array', items: safetyItem }
  },
  required: ['interactions', 'food_interactions', 'safety_alerts']
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { medications = [] } = await req.json().catch(() => ({ medications: [] }));

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({
      interactions: [],
      food_interactions: [],
      safety_alerts: [{
        medication_name: '—',
        title: 'AI analysis not configured',
        severity: 'low',
        description: 'Set ANTHROPIC_API_KEY in your Netlify environment to enable AI interaction analysis.'
      }],
      notice: 'ai_unconfigured'
    });
  }

  const list = medications
    .filter((m) => m && m.name)
    .map((m) => `- ${m.name}${m.dosage ? ` (${m.dosage})` : ''} [type: ${m.type || 'medication'}]`)
    .join('\n');

  const prompt = `You are a clinical drug-interaction analyzer assisting a patient-facing medication app.

Analyze this medication/supplement/vitamin/peptide list for interactions:
${list || '(none)'}

Return:
- interactions: clinically recognized drug-drug, drug-supplement, and supplement-supplement interactions between items ON THIS LIST. Use the exact names as given. Set severity by clinical significance and confidence 0-100. Be conservative — only include interactions that are genuinely documented; return an empty array if there are none.
- food_interactions: notable food/beverage interactions for individual items.
- safety_alerts: important general safety notes per item (e.g. monitoring, contraindications, limited-evidence warnings for research peptides).

This is informational and not medical advice. Do not invent interactions.`;

  const client = new Anthropic();

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 4096,
      thinking: { type: 'adaptive' },
      output_config: {
        effort: 'medium',
        format: { type: 'json_schema', schema: SCHEMA }
      },
      messages: [{ role: 'user', content: prompt }]
    });

    const text = message.content.find((b) => b.type === 'text')?.text || '{}';
    const data = JSON.parse(text);
    return Response.json(data);
  } catch (err) {
    return Response.json(
      {
        interactions: [],
        food_interactions: [],
        safety_alerts: [{
          medication_name: '—',
          title: 'Analysis temporarily unavailable',
          severity: 'low',
          description: 'The interaction service had an error. Please try again shortly.'
        }],
        error: String(err?.message || err)
      },
      { status: 200 }
    );
  }
}
