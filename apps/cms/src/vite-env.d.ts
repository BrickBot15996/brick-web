/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_CDN_URL: string;
  readonly VITE_CDN_PREVIEW: string;
  readonly VITE_AUTH_URL: string;
  readonly VITE_WEBSITE_URL: string;
  readonly VITE_LINKS_URL: string;
  readonly VITE_CMS_PREVIEW: string;
}
