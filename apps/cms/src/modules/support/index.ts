import type { ModuleDef } from '../types';
import { supportApi } from './data/api';
import { supportRoutes } from './routes';
import './support.css';

const support: ModuleDef = { id: 'support', built: true, routes: supportRoutes, search: (q) => supportApi.search(q) };
export default support;
