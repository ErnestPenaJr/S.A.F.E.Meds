/** One-tap sample data for demo mode — includes a peptide on an active cycle. */
import { Medication } from '@/api/entities';
import { dateKey } from '@/lib/schedule';

export async function seedSampleData() {
  const existing = await Medication.list();
  if (existing.length) return existing;

  const cycleStart = dateKey(new Date(Date.now() - 11 * 86400000)); // ~Day 12 of cycle

  await Medication.bulkCreate([
    {
      name: 'Lisinopril', type: 'medication', dosage: '10mg', form: 'tablet',
      frequency: 'once_daily', times: ['08:00'], active: true, prescribing_doctor: 'Dr. Smith'
    },
    {
      name: 'Metformin', type: 'medication', dosage: '500mg', form: 'tablet',
      frequency: 'twice_daily', times: ['08:00', '18:00'], with_food: true, active: true
    },
    {
      name: 'Vitamin D3', type: 'vitamin', dosage: '2000 IU', form: 'softgel',
      frequency: 'once_daily', times: ['08:00'], active: true
    },
    {
      name: 'Magnesium', type: 'supplement', dosage: '400mg', form: 'capsule',
      frequency: 'once_daily', times: ['21:00'], active: true,
      supplement_purpose: 'Sleep & recovery'
    },
    {
      name: 'BPC-157', type: 'peptide', dosage: '250mcg', form: 'subcutaneous_injection',
      frequency: 'twice_daily', times: ['08:00', '20:00'], active: true,
      vial_amount_mg: 5, bac_water_ml: 2, concentration_mcg_per_ml: 2500,
      dose_amount: 250, dose_unit: 'mcg', injection_route: 'subcutaneous',
      injection_sites: ['Abdomen (L)', 'Abdomen (R)'],
      cycle_weeks_on: 4, cycle_weeks_off: 2, cycle_start_date: cycleStart
    }
  ]);

  return Medication.list();
}
