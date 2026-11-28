import type { ModuleDef } from '../types';
import { linktreeApi } from './data/api';
import { linktreeRoutes } from './routes';
import './linktree.css';

const linktree: ModuleDef = { id: 'linktree', built: true, routes: linktreeRoutes, search: (q) => linktreeApi.search(q) };
export default linktree;
