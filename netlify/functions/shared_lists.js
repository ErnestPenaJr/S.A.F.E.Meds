import { createCrudHandler } from './_lib/crud.js';
import { shared_lists } from '../../src/db/schema.js';

export default createCrudHandler(shared_lists, 'shared_lists');
export const config = { path: ['/api/shared_lists', '/api/shared_lists/*'] };
