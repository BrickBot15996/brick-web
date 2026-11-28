import type { ModuleDef } from '../types';
import { adminApi } from './data/api';
import { userRoutes } from './routes';
import './users.css';

const users: ModuleDef = { id: 'users', built: true, routes: userRoutes, search: (q) => adminApi.search(q) };
export default users;
