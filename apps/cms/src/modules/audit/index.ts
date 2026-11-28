import type { ModuleDef } from '../types';
import { auditApi } from './data/api';
import { auditRoutes } from './routes';
import './audit.css';

const audit: ModuleDef = { id: 'audit', built: true, routes: auditRoutes, search: (q) => auditApi.search(q) };
export default audit;
