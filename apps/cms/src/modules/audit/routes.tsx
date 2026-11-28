import { createRoute, lazyRouteComponent } from '@tanstack/react-router';
import type { AnyRoute } from '@tanstack/react-router';

export function auditRoutes(parent: AnyRoute): AnyRoute[] {
  return [createRoute({ getParentRoute: () => parent, path: '/admin/audit', component: lazyRouteComponent(() => import('./AuditPage'), 'AuditPage') })];
}
