import { createRoute, lazyRouteComponent } from '@tanstack/react-router';
import type { AnyRoute } from '@tanstack/react-router';

/** /short-urls: the table; "new" and "$slug" open a dialog over it, so every state has its own address. */
export function shortUrlRoutes(parent: AnyRoute): AnyRoute[] {
  const layout = createRoute({ getParentRoute: () => parent, path: '/short-urls', component: lazyRouteComponent(() => import('./ShortUrlsPage'), 'ShortUrlsLayout') });
  return [layout.addChildren([
    createRoute({ getParentRoute: () => layout, path: '/', component: () => null }),
    createRoute({ getParentRoute: () => layout, path: 'new', component: lazyRouteComponent(() => import('./ShortUrlsPage'), 'ShortUrlNew') }),
    createRoute({ getParentRoute: () => layout, path: '$slug', component: lazyRouteComponent(() => import('./ShortUrlsPage'), 'ShortUrlEdit') }),
  ])];
}
