/**
 * S.A.F.E Meds — database schema (Drizzle ORM, Postgres / Neon).
 *
 * JS property names are snake_case and timestamps are `created_date` /
 * `updated_date` ON PURPOSE: they match the field names the client app already
 * uses (the demo store + entity facade), so the Netlify data functions can pass
 * rows straight through with no camel/snake translation. Timestamps use
 * mode:'string' (ISO strings) and numerics mode:'number' to mirror the client.
 *
 * Per-user isolation: every row carries `user_id` (the Stack/Neon Auth user id);
 * the data API scopes every query by it.
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

/* shared timestamp columns (ISO strings, to match the client) */
const stamps = {
  created_date: timestamp('created_date', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updated_date: timestamp('updated_date', { withTimezone: true, mode: 'string' }).defaultNow().notNull()
};

/* ── users (built-in email/password auth) ── */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  full_name: text('full_name'),
  ...stamps
});

/* ── profiles ── */
export const profiles = pgTable('profiles', {
  user_id: text('user_id').primaryKey(),
  email: text('email'),
  full_name: text('full_name'),
  allergies: text('allergies').array().default(sql`'{}'`),
  notifications_enabled: boolean('notifications_enabled').default(true).notNull(),
  notification_lead_time: integer('notification_lead_time').default(15).notNull(),
  theme: themeEnum('theme').default('vital').notNull(),
  ...stamps
});

/* ── medications ── */
export const medications = pgTable('medications', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: text('user_id').notNull(),
  name: text('name').notNull(),
  type: medTypeEnum('type').default('medication').notNull(),
  generic_name: text('generic_name'),
  brand_name: text('brand_name'),
  dosage: text('dosage'),
  form: formEnum('form'),
  color: text('color'),
  shape: shapeEnum('shape'),
  imprint: text('imprint'),
  reminder_enabled: boolean('reminder_enabled').default(true).notNull(),
  side_effects: text('side_effects'),
  frequency: frequencyEnum('frequency').default('once_daily').notNull(),
  custom_frequency: text('custom_frequency'),
  times: text('times').array().default(sql`'{}'`),
  with_food: boolean('with_food').default(false),
  instructions: text('instructions'),
  prescribing_doctor: text('prescribing_doctor'),
  start_date: date('start_date'),
  end_date: date('end_date'),
  pharmacy: text('pharmacy'),
  ndc_number: text('ndc_number'),
  rxnorm_id: text('rxnorm_id'),
  active: boolean('active').default(true).notNull(),
  notes: text('notes'),
  quantity: integer('quantity'),
  refills_left: integer('refills_left'),
  refill_due_date: date('refill_due_date'),
  supplement_purpose: text('supplement_purpose'),
  ingredient_list: text('ingredient_list').array().default(sql`'{}'`),
  // peptide-specific
  vial_amount_mg: numeric('vial_amount_mg', { mode: 'number' }),
  bac_water_ml: numeric('bac_water_ml', { mode: 'number' }),
  concentration_mcg_per_ml: numeric('concentration_mcg_per_ml', { mode: 'number' }),
  dose_amount: numeric('dose_amount', { mode: 'number' }),
  dose_unit: doseUnitEnum('dose_unit'),
  injection_route: injectionRouteEnum('injection_route'),
  injection_sites: text('injection_sites').array().default(sql`'{}'`),
  cycle_weeks_on: integer('cycle_weeks_on'),
  cycle_weeks_off: integer('cycle_weeks_off'),
  cycle_start_date: date('cycle_start_date'),
  ...stamps
});

/* ── medication_schedules ── */
export const medication_schedules = pgTable('medication_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: text('user_id').notNull(),
  medication_id: uuid('medication_id').notNull().references(() => medications.id, { onDelete: 'cascade' }),
  scheduled_time: text('scheduled_time').notNull(),
  date: date('date').notNull(),
  taken: boolean('taken').default(false).notNull(),
  taken_at: timestamp('taken_at', { withTimezone: true, mode: 'string' }),
  skipped: boolean('skipped').default(false).notNull(),
  notes: text('notes'),
  injection_site: text('injection_site'),
  adherence_streak: integer('adherence_streak').default(0).notNull(),
  ...stamps
});

/* ── drug_interactions ── */
export const drug_interactions = pgTable('drug_interactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: text('user_id').notNull(),
  medication_a_id: uuid('medication_a_id'),
  medication_b_id: uuid('medication_b_id'),
  medication_a_name: text('medication_a_name'),
  medication_b_name: text('medication_b_name'),
  severity: severityEnum('severity').notNull(),
  confidence: integer('confidence'),
  description: text('description').notNull(),
  mechanism: text('mechanism'),
  clinical_effects: text('clinical_effects').array().default(sql`'{}'`),
  recommendations: text('recommendations').array().default(sql`'{}'`),
  source: interactionSourceEnum('source'),
  acknowledged: boolean('acknowledged').default(false).notNull(),
  acknowledged_at: timestamp('acknowledged_at', { withTimezone: true, mode: 'string' }),
  ...stamps
});

/* ── pharmacies ── */
export const pharmacies = pgTable('pharmacies', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: text('user_id').notNull(),
  name: text('name').notNull(),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  zip: text('zip'),
  phone: text('phone'),
  fax: text('fax'),
  hours: text('hours'),
  latitude: numeric('latitude', { mode: 'number' }),
  longitude: numeric('longitude', { mode: 'number' }),
  is_favorite: boolean('is_favorite').default(false).notNull(),
  notes: text('notes'),
  ...stamps
});

/* ── emergency_contacts ── */
export const emergency_contacts = pgTable('emergency_contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: text('user_id').notNull(),
  name: text('name').notNull(),
  relationship: relationshipEnum('relationship').notNull(),
  phone: text('phone').notNull(),
  phone_secondary: text('phone_secondary'),
  email: text('email'),
  is_primary: boolean('is_primary').default(false).notNull(),
  can_view_medications: boolean('can_view_medications').default(false).notNull(),
  notes: text('notes'),
  ...stamps
});

/* ── shared_lists ── */
export const shared_lists = pgTable('shared_lists', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: text('user_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  medication_ids: uuid('medication_ids').array().default(sql`'{}'`),
  recipient_email: text('recipient_email'),
  recipient_name: text('recipient_name'),
  share_type: shareTypeEnum('share_type'),
  include_schedule: boolean('include_schedule').default(true).notNull(),
  favorite_pharmacy: text('favorite_pharmacy'),
  access_code: text('access_code'),
  expires_at: timestamp('expires_at', { withTimezone: true, mode: 'string' }),
  active: boolean('active').default(true).notNull(),
  ...stamps
});
