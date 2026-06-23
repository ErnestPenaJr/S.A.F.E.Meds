import { createCrudHandler } from './_lib/crud.js';
import { medication_schedules } from '../../src/db/schema.js';

export default createCrudHandler(medication_schedules, 'medication_schedules');
export const config = { path: ['/api/medication_schedules', '/api/medication_schedules/*'] };
