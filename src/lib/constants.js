/** Shared option lists + labels for forms, filters, and badges. */

export const MED_TYPES = [
  { value: 'medication', label: 'Medication' },
  { value: 'supplement', label: 'Supplement' },
  { value: 'vitamin', label: 'Vitamin' },
  { value: 'herbal', label: 'Herbal' },
  { value: 'peptide', label: 'Peptide' }
];

// Fixed type colors (literal classes so Tailwind keeps them) — readable on every theme.
export const TYPE_STYLES = {
  medication: 'bg-blue-100 text-blue-700',
  supplement: 'bg-emerald-100 text-emerald-700',
  vitamin: 'bg-amber-100 text-amber-700',
  herbal: 'bg-green-100 text-green-700',
  peptide: 'bg-violet-100 text-violet-700'
};

export const FORMS = [
  'tablet', 'capsule', 'liquid', 'injection', 'topical', 'inhaler',
  'patch', 'drops', 'powder', 'gummy', 'softgel',
  'subcutaneous_injection', 'intramuscular_injection', 'nasal_spray'
];

export const FREQUENCIES = [
  { value: 'once_daily', label: 'Once daily' },
  { value: 'twice_daily', label: 'Twice daily' },
  { value: 'three_times_daily', label: '3× daily' },
  { value: 'four_times_daily', label: '4× daily' },
  { value: 'as_needed', label: 'As needed' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'custom', label: 'Custom' }
];

export const DOSE_UNITS = ['mcg', 'mg', 'IU', 'mL', 'units'];

export const INJECTION_ROUTES = [
  { value: 'subcutaneous', label: 'Subcutaneous (SC)' },
  { value: 'intramuscular', label: 'Intramuscular (IM)' },
  { value: 'intravenous', label: 'Intravenous (IV)' }
];

export const INJECTION_SITES = [
  'Abdomen (L)', 'Abdomen (R)', 'Thigh (L)', 'Thigh (R)',
  'Glute (L)', 'Glute (R)', 'Deltoid (L)', 'Deltoid (R)'
];

export const labelForType = (v) => MED_TYPES.find((t) => t.value === v)?.label || v;
export const labelForFrequency = (v) => FREQUENCIES.find((f) => f.value === v)?.label || v;
