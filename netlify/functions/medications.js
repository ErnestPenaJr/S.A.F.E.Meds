import { createCrudHandler } from './_lib/crud.js';
import { medications } from '../../src/db/schema.js';

export default createCrudHandler(medications, 'medications');
export const config = { path: ['/api/medications', '/api/medications/*'] };
