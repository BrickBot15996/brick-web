import { createRoute, lazyRouteComponent } from '@tanstack/react-router';
import type { AnyRoute } from '@tanstack/react-router';

/** /press: one single-record page. */
export function pressRoutes(parent: AnyRoute): AnyRoute[] {
  return [createRoute({ getParentRoute: () => parent, path: '/press', component: lazyRouteComponent(() => import('./PressPage'), 'PressPage') })];
}
