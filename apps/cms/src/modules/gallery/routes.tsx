import { createRoute, lazyRouteComponent } from '@tanstack/react-router';
import type { AnyRoute } from '@tanstack/react-router';

/** /gallery: a layout route (filterable grid + Outlet) with an index and an item route. New items come from the Upload and YouTube dialogs. */
export function galleryRoutes(parent: AnyRoute): AnyRoute[] {
  const layout = createRoute({ getParentRoute: () => parent, path: '/gallery', component: lazyRouteComponent(() => import('./GalleryPage'), 'GalleryLayout') });
  return [layout.addChildren([
    createRoute({ getParentRoute: () => layout, path: '/', component: lazyRouteComponent(() => import('./GalleryPage'), 'GalleryIndex') }),
    createRoute({ getParentRoute: () => layout, path: '$id', component: lazyRouteComponent(() => import('./GalleryEditor'), 'GalleryEdit') }),
  ])];
}
