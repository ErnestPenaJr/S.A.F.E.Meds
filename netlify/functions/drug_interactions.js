import { createCrudHandler } from './_lib/crud.js';
import { drug_interactions } from '../../src/db/schema.js';

export default createCrudHandler(drug_interactions, 'drug_interactions');
export const config = { path: ['/api/drug_interactions', '/api/drug_interactions/*'] };
