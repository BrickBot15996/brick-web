import { createRoute, lazyRouteComponent } from '@tanstack/react-router';
import type { AnyRoute } from '@tanstack/react-router';

/** /settings: one single-record page. Its sections are anchors (#contact, #address, #association, #socials) for the jump palette. */
export function settingsRoutes(parent: AnyRoute): AnyRoute[] {
  return [createRoute({ getParentRoute: () => parent, path: '/settings', component: lazyRouteComponent(() => import('./SettingsScreen'), 'SettingsPageRoute') })];
}
