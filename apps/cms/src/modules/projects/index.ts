import type { ModuleDef } from '../types';
import { projectsApi } from './data/api';
import { projectRoutes } from './routes';
import './projects.css';

const projects: ModuleDef = { id: 'projects', built: true, routes: projectRoutes, search: (q) => projectsApi.search(q) };
export default projects;
