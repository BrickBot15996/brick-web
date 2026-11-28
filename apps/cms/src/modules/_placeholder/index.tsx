import { createRoute } from '@tanstack/react-router';
import type { AnyRoute } from '@tanstack/react-router';
import { moduleById } from '../../lib/modules';
import type { ModuleDef } from '../types';
import { ModulePage } from './ModulePage';

/**
 * The stand-in every unbuilt module folder re-exports (`export default placeholderModule('blog')`). A module agent
 * replaces its folder's index.ts with a real ModuleDef; nothing else changes.
 */
export function placeholderModule(id: string): ModuleDef {
  return {
    id,
    built: false,
    routes: (parent: AnyRoute) => {
      const m = moduleById(id);
      if (!m) return [];
      // A trailing splat also matches the bare path, so /blog and /blog/anything share one placeholder.
      return [createRoute({ getParentRoute: () => parent, path: `${m.path}/$`, component: () => <ModulePage id={id} /> }) as AnyRoute];
    },
  };
}
