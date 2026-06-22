/**
 * Demo-mode interaction analysis. Produces realistic, deterministic results
 * from the user's med list so the Interactions page is fully usable without a
 * backend. In live mode the Netlify function calls Claude instead (see ai.js).
 * Informational only — not medical advice.
 */
const norm = (s) => (s || '').toLowerCase().trim();

// Known pairs keyed by the two names sorted + joined with '|'.
const PAIRS = {
  'lisinopril|metformin': {
    severity: 'low', confidence: 55,
    description: 'ACE inhibitors may enhance the blood-glucose-lowering effect of metformin.',
    mechanism: 'Improved insulin sensitivity from ACE inhibition.',
    clinical_effects: ['Possible enhanced hypoglycemic effect'],
    recommendations: ['Monitor blood glucose', 'Watch for signs of low blood sugar']
  },
  'lisinopril|magnesium': {
    severity: 'low', confidence: 40,
    description: 'Generally compatible; magnesium may modestly support blood-pressure control.',
    mechanism: 'Additive vascular effects.',
    clinical_effects: ['Slightly increased blood-pressure lowering'],
    recommendations: ['Separate dosing by ~2 hours if GI upset', 'Monitor blood pressure']
  },
  'magnesium|metformin': {
    severity: 'low', confidence: 35,
    description: 'Magnesium may slightly affect metformin absorption when taken together.',
    mechanism: 'Cation binding in the GI tract.',
    clinical_effects: ['Minor reduction in absorption'],
    recommendations: ['Separate dosing by ~2 hours']
  },
  'magnesium|vitamin d3': {
    severity: 'low', confidence: 30,
    description: 'Magnesium is a cofactor in vitamin D metabolism — generally beneficial together.',
    mechanism: 'Magnesium-dependent vitamin D activation.',
    clinical_effects: ['Supports vitamin D utilization'],
    recommendations: ['No action needed']
  }
};

const FOODS = {
  lisinopril: [
    { food: 'Potassium-rich foods & salt substitutes', severity: 'medium', description: 'Lisinopril can raise potassium; high intake may cause hyperkalemia.', recommendation: 'Avoid potassium-based salt substitutes; moderate high-potassium foods.' },
    { food: 'Alcohol', severity: 'low', description: 'May intensify blood-pressure lowering.', recommendation: 'Limit alcohol.' }
  ],
  metformin: [
    { food: 'Alcohol', severity: 'medium', description: 'Raises the risk of lactic acidosis and low blood sugar.', recommendation: 'Avoid excessive alcohol.' },
    { food: 'Meals', severity: 'low', description: 'Taking with food reduces GI upset.', recommendation: 'Take with meals.' }
  ],
  magnesium: [
    { food: 'High-dose calcium or zinc', severity: 'low', description: 'Can compete for absorption.', recommendation: 'Separate dosing.' }
  ],
  'vitamin d3': [
    { food: 'Dietary fat', severity: 'low', description: 'Fat-soluble vitamin — absorbed better with fat.', recommendation: 'Take with a meal containing fat.' }
  ]
};

const SAFETY = {
  lisinopril: { title: 'ACE inhibitor cautions', severity: 'medium', description: 'Watch for a persistent dry cough or dizziness. Swelling of the face/lips (angioedema) is rare but needs urgent care. Avoid during pregnancy.' },
  metformin: { title: 'Metformin monitoring', severity: 'low', description: 'Rare risk of lactic acidosis; long-term use can lower vitamin B12. Report unusual fatigue or muscle pain.' }
};

export function mockAnalyze(meds = []) {
  const active = meds.filter((m) => m.active !== false);

  const interactions = [];
  for (let i = 0; i < active.length; i += 1) {
    for (let j = i + 1; j < active.length; j += 1) {
      const a = active[i];
      const b = active[j];
      const key = [norm(a.name), norm(b.name)].sort().join('|');
      const k = PAIRS[key];
      if (!k) continue;
      interactions.push({
        medication_a_id: a.id,
        medication_b_id: b.id,
        medication_a_name: a.name,
        medication_b_name: b.name,
        severity: k.severity,
        confidence: k.confidence,
        description: k.description,
        mechanism: k.mechanism,
        clinical_effects: k.clinical_effects,
        recommendations: k.recommendations
      });
    }
  }

  const food_interactions = [];
  for (const m of active) {
    const list = FOODS[norm(m.name)];
    if (list) list.forEach((f) => food_interactions.push({ medication_name: m.name, ...f }));
  }

  const safety_alerts = [];
  for (const m of active) {
    const s = SAFETY[norm(m.name)];
    if (s) {
      safety_alerts.push({ medication_name: m.name, ...s });
    } else if (m.type === 'peptide') {
      safety_alerts.push({
        medication_name: m.name,
        title: 'Peptide — limited clinical data',
        severity: 'medium',
        description: 'This peptide may not be FDA-approved and human safety data can be limited. Use sterile technique, rotate injection sites, and consult a clinician.'
      });
    }
  }

  return { interactions, food_interactions, safety_alerts };
}
