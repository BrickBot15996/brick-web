import { createRoute, lazyRouteComponent } from '@tanstack/react-router';
import type { AnyRoute } from '@tanstack/react-router';

/** /projects: a layout route (list column + Outlet) with an index, a "new" and an item route. */
export function projectRoutes(parent: AnyRoute): AnyRoute[] {
  const layout = createRoute({ getParentRoute: () => parent, path: '/projects', component: lazyRouteComponent(() => import('./ProjectsList'), 'ProjectsLayout') });
  return [layout.addChildren([
    createRoute({ getParentRoute: () => layout, path: '/', component: lazyRouteComponent(() => import('./ProjectsList'), 'ProjectsIndex') }),
    createRoute({ getParentRoute: () => layout, path: 'new', component: lazyRouteComponent(() => import('./ProjectEditor'), 'ProjectNew') }),
    createRoute({ getParentRoute: () => layout, path: '$id', component: lazyRouteComponent(() => import('./ProjectEditor'), 'ProjectEdit') }),
  ])];
}
