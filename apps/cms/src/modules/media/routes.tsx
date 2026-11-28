import { createRoute, lazyRouteComponent } from '@tanstack/react-router';
import type { AnyRoute } from '@tanstack/react-router';

/** /media: one screen (folder rail, grid or list, inspector). `?file=<key>` selects a file (the jump palette uses it). */
export function mediaRoutes(parent: AnyRoute): AnyRoute[] {
  return [createRoute({ getParentRoute: () => parent, path: '/media', component: lazyRouteComponent(() => import('./MediaLibrary'), 'MediaLibrary') })];
}
