import { createRoute, lazyRouteComponent } from '@tanstack/react-router';
import type { AnyRoute } from '@tanstack/react-router';

/** /linktree: the card editor beside a live phone preview. */
export function linktreeRoutes(parent: AnyRoute): AnyRoute[] {
  return [createRoute({ getParentRoute: () => parent, path: '/linktree', component: lazyRouteComponent(() => import('./LinktreeScreen'), 'LinktreeScreen') })];
}
