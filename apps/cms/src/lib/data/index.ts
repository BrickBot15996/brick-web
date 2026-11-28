import type { CmsClient } from './client';
import { liveClient } from './live';
import { previewClient } from './preview';
import { unconfiguredClient } from './unconfigured';

export const PREVIEW = import.meta.env.VITE_CMS_PREVIEW === 'true';
/** The one core client the app talks to. Module data goes through each module's own api (see ./module). */
export const cms: CmsClient = PREVIEW ? previewClient : import.meta.env.VITE_SUPABASE_URL ? liveClient : unconfiguredClient;
export type { CmsClient } from './client';
export * from './types';
