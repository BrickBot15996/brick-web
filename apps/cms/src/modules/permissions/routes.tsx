import { createRoute, lazyRouteComponent } from '@tanstack/react-router';
import type { AnyRoute } from '@tanstack/react-router';

export function permissionRoutes(parent: AnyRoute): AnyRoute[] {
  return [createRoute({ getParentRoute: () => parent, path: '/admin/permissions', component: lazyRouteComponent(() => import('./PermissionsPage'), 'PermissionsPage') })];
}
