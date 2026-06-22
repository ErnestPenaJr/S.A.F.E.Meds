/**
 * S.A.F.E Meds — database schema (Drizzle ORM, Postgres / Neon).
 *
 * Per-user isolation: every row carries `user_id` (the Stack Auth / Neon Auth
 * user id, which mirrors `neon_auth.users_sync.id`). The data API in
 * netlify/functions scopes every query by the authenticated user_id; Postgres
 * RLS can be layered on top later since Neon Auth is RLS-ready.
 */
import { sql } from 'drizzle-orm';
import {
  pgTable, pgEnum, uuid, text, boolean, integer, numeric, date, timestamp
} from 'drizzle-orm/pg-core';

/* ── enums ──────────────────────────────────────────────── */
export const medTypeEnum = pgEnum('med_type', ['medication', 'supplement', 'vitamin', 'herbal', 'peptide']);
export const formEnum = pgEnum('med_form', [
  'tablet', 'capsule', 'liquid', 'injection', 'topical', 'inhaler',
  'patch', 'drops', 'powder', 'gummy', 'softgel',
  'subcutaneous_injection', 'intramuscular_injection', 'nasal_spray'
]);
export const shapeEnum = pgEnum('med_shape', ['round', 'oval', 'capsule', 'rectangle', 'triangle', 'diamond', 'other']);
export const frequencyEnum = pgEnum('med_frequency', [
  'once_daily', 'twice_daily', 'three_times_daily', 'four_times_daily',
  'as_needed', 'weekly', 'monthly', 'custom'
]);
export const doseUnitEnum = pgEnum('dose_unit', ['mg', 'mcg', 'IU', 'mL', 'units']);
export const injectionRouteEnum = pgEnum('injection_route', ['subcutaneous', 'intramuscular', 'intravenous']);
export const severityEnum = pgEnum('interaction_severity', ['high', 'medium', 'low']);
export const interactionSourceEnum = pgEnum('interaction_source', ['openFDA', 'rxnorm', 'manual', 'user_confirmed', 'ai']);
export const relationshipEnum = pgEnum('contact_relationship', ['spouse', 'parent', 'child', 'sibling', 'friend', 'caregiver', 'doctor', 'other']);
export const shareTypeEnum = pgEnum('share_type', ['doctor', 'family', 'caregiver']);
export const themeEnum = pgEnum('app_theme', ['vital', 'after-dark', 'bento', 'clear']);

/* shared timestamp columns */
const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
};

/* ── profiles (per-user settings; mirrors built-in User custom fields) ── */
export const profiles = pgTable('profiles', {
  userId: text('user_id').primaryKey(), // = neon_auth user id
  email: text('email'),
  fullName: text('full_name'),
  allergies: text('allergies').array().default(sql`'{}'`),
  notificationsEnabled: boolean('notifications_enabled').default(true).notNull(),
  notificationLeadTime: integer('notification_lead_time').default(15).notNull(), // minutes before dose
  theme: themeEnum('theme').default('vital').notNull(),
  ...timestamps
});

/* ── medications (incl. supplements, vitamins, herbals, peptides) ── */
export const medications = pgTable('medications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  type: medTypeEnum('type').default('medication').notNull(),
  genericName: text('generic_name'),
  brandName: text('brand_name'),
  dosage: text('dosage'),                 // display string e.g. "10mg"
  form: formEnum('form'),
  color: text('color'),
  shape: shapeEnum('shape'),
  imprint: text('imprint'),
  reminderEnabled: boolean('reminder_enabled').default(true).notNull(),
  sideEffects: text('side_effects'),
  frequency: frequencyEnum('frequency').default('once_daily').notNull(),
  customFrequency: text('custom_frequency'),
  times: text('times').array().default(sql`'{}'`),   // ["08:00","20:00"]
  withFood: boolean('with_food').default(false),
  instructions: text('instructions'),
  prescribingDoctor: text('prescribing_doctor'),
  startDate: date('start_date'),
  endDate: date('end_date'),
  pharmacy: text('pharmacy'),
  ndcNumber: text('ndc_number'),
  rxnormId: text('rxnorm_id'),
  active: boolean('active').default(true).notNull(),
  notes: text('notes'),
  quantity: integer('quantity'),
  refillsLeft: integer('refills_left'),
  refillDueDate: date('refill_due_date'),
  supplementPurpose: text('supplement_purpose'),
  ingredientList: text('ingredient_list').array().default(sql`'{}'`),

  /* ── peptide-specific ── */
  vialAmountMg: numeric('vial_amount_mg'),                 // e.g. 5 (mg in vial)
  bacWaterMl: numeric('bac_water_ml'),                     // e.g. 2 (mL reconstitution fluid)
  concentrationMcgPerMl: numeric('concentration_mcg_per_ml'), // derived: vial_mg*1000 / bac_mL
  doseAmount: numeric('dose_amount'),                      // e.g. 250
  doseUnit: doseUnitEnum('dose_unit'),                     // mcg / IU / mg / mL
  injectionRoute: injectionRouteEnum('injection_route'),
  injectionSites: text('injection_sites').array().default(sql`'{}'`), // rotation pool
  cycleWeeksOn: integer('cycle_weeks_on'),
  cycleWeeksOff: integer('cycle_weeks_off'),
  cycleStartDate: date('cycle_start_date'),

  ...timestamps
});

/* ── medication_schedules (individual dose instances) ── */
export const medicationSchedules = pgTable('medication_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  medicationId: uuid('medication_id').notNull().references(() => medications.id, { onDelete: 'cascade' }),
  scheduledTime: text('scheduled_time').notNull(),  // "08:00"
  date: date('date').notNull(),
  taken: boolean('taken').default(false).notNull(),
  takenAt: timestamp('taken_at', { withTimezone: true }),
  skipped: boolean('skipped').default(false).notNull(),
  notes: text('notes'),
  injectionSite: text('injection_site'),            // site used for this peptide dose
  adherenceStreak: integer('adherence_streak').default(0).notNull(),
  ...timestamps
});

/* ── drug_interactions ── */
export const drugInteractions = pgTable('drug_interactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  medicationAId: uuid('medication_a_id'),
  medicationBId: uuid('medication_b_id'),
  medicationAName: text('medication_a_name'),
  medicationBName: text('medication_b_name'),
  severity: severityEnum('severity').notNull(),
  confidence: integer('confidence'),                // 0–100
  description: text('description').notNull(),
  mechanism: text('mechanism'),
  clinicalEffects: text('clinical_effects').array().default(sql`'{}'`),
  recommendations: text('recommendations').array().default(sql`'{}'`),
  source: interactionSourceEnum('source'),
  acknowledged: boolean('acknowledged').default(false).notNull(),
  acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
  ...timestamps
});

/* ── pharmacies (user's saved pharmacies) ── */
export const pharmacies = pgTable('pharmacies', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  zip: text('zip'),
  phone: text('phone'),
  fax: text('fax'),
  hours: text('hours'),
  latitude: numeric('latitude'),
  longitude: numeric('longitude'),
  isFavorite: boolean('is_favorite').default(false).notNull(),
  notes: text('notes'),
  ...timestamps
});

/* ── emergency_contacts ── */
export const emergencyContacts = pgTable('emergency_contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  relationship: relationshipEnum('relationship').notNull(),
  phone: text('phone').notNull(),
  phoneSecondary: text('phone_secondary'),
  email: text('email'),
  isPrimary: boolean('is_primary').default(false).notNull(),
  canViewMedications: boolean('can_view_medications').default(false).notNull(),
  notes: text('notes'),
  ...timestamps
});

/* ── shared_lists (shareable med lists via access code) ── */
export const sharedLists = pgTable('shared_lists', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  medicationIds: uuid('medication_ids').array().default(sql`'{}'`),
  recipientEmail: text('recipient_email'),
  recipientName: text('recipient_name'),
  shareType: shareTypeEnum('share_type'),
  includeSchedule: boolean('include_schedule').default(true).notNull(),
  favoritePharmacy: text('favorite_pharmacy'), // JSON string snapshot
  accessCode: text('access_code'),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  active: boolean('active').default(true).notNull(),
  ...timestamps
});
