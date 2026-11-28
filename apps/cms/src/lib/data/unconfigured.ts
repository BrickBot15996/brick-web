import type { CmsClient } from './client';

/**
 * Stand-in for builds without preview mode while Supabase isn't wired: there is no session, so the app sends the
 * visitor to auth, and nothing else is reachable. Replace with the real client (same interface) once the project exists.
 */
const off = () => Promise.reject(new Error('The CMS backend is not configured yet.'));
export const unconfiguredClient: CmsClient = {
  preview: false,
  canPublish: false,
  getSession: () => Promise.resolve(null),
  signOut: () => { location.href = import.meta.env.VITE_AUTH_URL; return Promise.resolve(); },
  listActivity: off,
  logActivity: () => {},
  getPublishStatus: off,
  publish: off,
  listSeasons: off,
};
