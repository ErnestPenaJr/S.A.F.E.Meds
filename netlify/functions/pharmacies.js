import { createCrudHandler } from './_lib/crud.js';
import { pharmacies } from '../../src/db/schema.js';

export default createCrudHandler(pharmacies, 'pharmacies');
export const config = { path: ['/api/pharmacies', '/api/pharmacies/*'] };
