/** Dose-instance generation, take/skip, and adherence streak. */
import { format } from 'date-fns';
import { Medication, MedicationSchedule } from '@/api/entities';
import { cycleStatus } from '@/lib/peptides';

export const FREQUENCY_DEFAULT_TIMES = {
  once_daily: ['09:00'],
  twice_daily: ['09:00', '21:00'],
  three_times_daily: ['08:00', '14:00', '20:00'],
  four_times_daily: ['08:00', '12:00', '16:00', '20:00'],
  weekly: ['09:00'],
  monthly: ['09:00'],
  as_needed: [],
  custom: []
};

const DAILY = new Set(['once_daily', 'twice_daily', 'three_times_daily', 'four_times_daily']);

export const dateKey = (d = new Date()) => format(d, 'yyyy-MM-dd');

export function timesForMed(med) {
  if (Array.isArray(med.times) && med.times.length) return med.times;
  return FREQUENCY_DEFAULT_TIMES[med.frequency] || [];
}

/** 24h "HH:MM" -> "8:00 AM". */
export function formatTime(hhmm) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

function isDueOn(med, dateStr) {
  if (!med.active) return false;
  if (!DAILY.has(med.frequency)) return false; // weekly/monthly/as_needed: not auto-generated
  if (med.start_date && dateStr < med.start_date) return false;
  if (med.end_date && dateStr > med.end_date) return false;
  if (med.type === 'peptide' && med.cycle_start_date && med.cycle_weeks_on) {
    const cs = cycleStatus(med.cycle_start_date, med.cycle_weeks_on, med.cycle_weeks_off, new Date(dateStr));
    if (cs && cs.phase === 'off') return false;
  }
  return true;
}

/** Make sure every active med's doses exist for `dateStr`; returns that day's schedule. */
export async function ensureSchedulesForDate(dateStr = dateKey()) {
  const meds = await Medication.filter({ active: true });
  const existing = await MedicationSchedule.filter({ date: dateStr });
  const have = new Set(existing.map((s) => `${s.medication_id}@${s.scheduled_time}`));

  const toCreate = [];
  for (const med of meds) {
    if (!isDueOn(med, dateStr)) continue;
    for (const t of timesForMed(med)) {
      if (!have.has(`${med.id}@${t}`)) {
        toCreate.push({ medication_id: med.id, scheduled_time: t, date: dateStr, taken: false, skipped: false });
      }
    }
  }
  if (toCreate.length) await MedicationSchedule.bulkCreate(toCreate);
  return MedicationSchedule.filter({ date: dateStr }, 'scheduled_time');
}

export function markTaken(scheduleId, injectionSite) {
  return MedicationSchedule.update(scheduleId, {
    taken: true,
    skipped: false,
    taken_at: new Date().toISOString(),
    ...(injectionSite ? { injection_site: injectionSite } : {})
  });
}

export function markSkipped(scheduleId) {
  return MedicationSchedule.update(scheduleId, { skipped: true, taken: false, taken_at: null });
}

export function resetDose(scheduleId) {
  return MedicationSchedule.update(scheduleId, { taken: false, skipped: false, taken_at: null });
}

/** Consecutive days (ending today) where all scheduled doses were taken. */
export async function computeStreak() {
  const all = await MedicationSchedule.list('-date', 600);
  const byDate = {};
  for (const s of all) (byDate[s.date] ||= []).push(s);

  const today = dateKey();
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 365; i += 1) {
    const k = dateKey(d);
    d.setDate(d.getDate() - 1);
    const doses = byDate[k];
    if (!doses || doses.length === 0) continue; // no meds scheduled: neutral
    if (doses.every((x) => x.taken)) {
      streak += 1;
      continue;
    }
    if (k === today) continue; // today still in progress: don't count, don't break
    break;
  }
  return streak;
}
