import { createCrudHandler } from './_lib/crud.js';
import { emergency_contacts } from '../../src/db/schema.js';

export default createCrudHandler(emergency_contacts, 'emergency_contacts');
export const config = { path: ['/api/emergency_contacts', '/api/emergency_contacts/*'] };
