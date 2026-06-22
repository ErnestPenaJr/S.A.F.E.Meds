/**
 * Entity SDK facade. Pages/components use these (Medication.list(), etc.) and
 * never touch the backend directly. Demo mode uses the localStorage store;
 * once VITE_STACK_PROJECT_ID is set, the same calls hit Netlify Functions.
 */
import { createLocalEntity } from '@/api/store/localStore';
import { createHttpEntity } from '@/api/store/httpStore';

const USE_API = Boolean(import.meta.env.VITE_STACK_PROJECT_ID);
const make = (name) => (USE_API ? createHttpEntity(name) : createLocalEntity(name));

export const Medication = make('medications');
export const MedicationSchedule = make('medication_schedules');
export const DrugInteraction = make('drug_interactions');
export const Pharmacy = make('pharmacies');
export const EmergencyContact = make('emergency_contacts');
export const SharedList = make('shared_lists');

export const isDemoData = !USE_API;
