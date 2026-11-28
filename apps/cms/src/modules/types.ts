import type { AnyRoute } from '@tanstack/react-router';
import type { SearchProvider } from '../lib/data/search';

/**
 * What a module folder exports from its `index.ts` (default export). The registry (./index.ts) collects them; the
 * router builds its tree and the jump palette its search from the registry. Nothing else knows about a module.
 */
export interface ModuleDef {
  /** The module's id in lib/modules.ts (its path, label, icon and permission come from the catalog there). */
  id: string;
  /** Routes of the module, children of the root route. The module owns every URL under its catalog `path`. */
  routes: (parent: AnyRoute) => AnyRoute[];
  /** Feeds the jump palette with items of this module (a post by title, a sponsor by name). Optional. */
  search?: SearchProvider;
  /** False (or absent) for a placeholder. Real modules set true. */
  built?: boolean;
}
