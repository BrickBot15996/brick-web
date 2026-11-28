import { createRoute, lazyRouteComponent, redirect } from '@tanstack/react-router';
import type { AnyRoute } from '@tanstack/react-router';

/** /_kit: the component kit's reference page. Registered only in development (router.tsx); its code is loaded on demand. */
export function kitRoutes(parent: AnyRoute): AnyRoute[] {
  const load = (name: 'KitLayout' | 'KitFields' | 'KitTable' | 'KitStates') => lazyRouteComponent(() => import('./kit'), name);
  const layout = createRoute({ getParentRoute: () => parent, path: '/_kit', component: load('KitLayout') });
  return [layout.addChildren([
    createRoute({ getParentRoute: () => layout, path: '/', beforeLoad: () => { throw redirect({ to: '/_kit/fields' }); } }),
    createRoute({ getParentRoute: () => layout, path: 'fields', component: load('KitFields') }),
    createRoute({ getParentRoute: () => layout, path: 'table', component: load('KitTable') }),
    createRoute({ getParentRoute: () => layout, path: 'states', component: load('KitStates') }),
  ])];
}
