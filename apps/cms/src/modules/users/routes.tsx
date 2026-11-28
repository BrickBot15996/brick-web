import { createRoute, lazyRouteComponent } from '@tanstack/react-router';
import type { AnyRoute } from '@tanstack/react-router';

export function userRoutes(parent: AnyRoute): AnyRoute[] {
  return [createRoute({ getParentRoute: () => parent, path: '/admin/users', component: lazyRouteComponent(() => import('./UsersPage'), 'UsersPage') })];
}
