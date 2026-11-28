import { PREVIEW } from './index';

/**
 * Wires one module's data interface to an implementation. Every module's `data/api.ts` ends with
 *
 *   export const projectsApi = defineApi<ProjectsApi>({ preview: previewProjects });
 *
 * - In preview mode the in-memory `preview` implementation is used.
 * - Otherwise `live` (the Supabase implementation, once someone writes it next to `preview.ts`) is used.
 * - With no `live` yet, every method rejects with "not configured", exactly like the core client. No stubs to write.
 */
export function defineApi<T extends object>(impl: { preview: T; live?: T }): T {
  if (PREVIEW) return impl.preview;
  if (impl.live) return impl.live;
  const off = () => Promise.reject(new Error('The CMS backend is not configured yet.'));
  return new Proxy({} as T, { get: () => off });
}
