import type { ModuleDef } from '../types';
import { permissionRoutes } from './routes';
import './permissions.css';

/** Search: the page itself. Members are found by the Users module. */
const permissions: ModuleDef = {
  id: 'permissions', built: true, routes: permissionRoutes,
  search: async (q) => {
    const n = q.trim().toLowerCase();
    return n.length > 1 && ['permissions', 'who can do what', 'matrix', 'access'].some((t) => t.includes(n) || n.includes(t))
      ? [{ id: 'permissions', label: 'Permissions', hint: 'Admin · who can do what', href: '/admin/permissions' }] : [];
  },
};
export default permissions;
