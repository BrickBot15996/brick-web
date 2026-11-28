import type { ModuleDef } from '../types';
import { teamApi } from './data/api';
import { teamRoutes } from './routes';
import './team.css';

const team: ModuleDef = { id: 'team', built: true, routes: teamRoutes, search: (q) => teamApi.search(q) };
export default team;
