/**
 * Helpers for the in-memory preview implementations (core and every module's `data/preview.ts`).
 * None of this ships to production: the real Supabase implementations never import it.
 */

/** The signed-in member in preview. Use it for `editedBy` on rows a preview mutation writes. */
export const PREVIEW_ME = 'maria.popescu@brickbot.ro';

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Simulated network time. No argument: 180–400 ms, like a real round trip. Pass a number for a fixed wait (search uses 60). */
export function previewDelay(ms?: number): Promise<void> {
  return wait(ms ?? 180 + Math.random() * 220);
}

/**
 * Preview switches, for trying states by hand. Each is read from the URL once and kept in sessionStorage for the tab:
 *   ?perms=cms.links,admin   the member's permissions (default: all three)        ?perms=reset  clears it
 *   ?fail=publish            the next publishes fail so the error state shows      ?fail=off     clears it
 *   ?fail=save               every preview save fails (see previewFailSave)
 */
export function previewFlag(name: string): string | null {
  try {
    const fromUrl = new URLSearchParams(location.search).get(name);
    if (fromUrl !== null) {
      if (fromUrl === '' || fromUrl === 'reset' || fromUrl === 'off') sessionStorage.removeItem(`bb-preview-${name}`);
      else sessionStorage.setItem(`bb-preview-${name}`, fromUrl);
    }
    return sessionStorage.getItem(`bb-preview-${name}`);
  } catch {
    return new URLSearchParams(location.search).get(name);
  }
}

/** Call at the top of a preview mutation so `?fail=save` shows the save-error state. */
export function previewFailSave(): void {
  if (previewFlag('fail') === 'save') throw new Error('The preview was told to fail this save.');
}

/** ISO time `m` minutes ago. Seed dates are relative to "now" so the activity groups always read Today / Yesterday / Earlier. */
export const minsAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
/** ISO time `d` days ago at hour `h`. */
export function daysAgo(d: number, h = 15): string {
  const x = new Date();
  x.setDate(x.getDate() - d);
  x.setHours(h, 20, 0, 0);
  return x.toISOString();
}
/** ISO time `d` days ago at "HH:MM". */
export function dayAt(d: number, hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const x = new Date();
  x.setDate(x.getDate() - d);
  x.setHours(h, m, 0, 0);
  return x.toISOString();
}
export const nowIso = () => new Date().toISOString();

// ───────── preview media ─────────
// Files the media pickers can list in preview. A module's preview store registers the keys its seed refers to.
const mediaKeys = new Set<string>(['brand/logo.svg', 'brand/wordmark.svg']);
export function addPreviewMedia(keys: Iterable<string | null | undefined>): void {
  for (const k of keys) if (k) mediaKeys.add(k);
}
export const previewMediaKeys = (): string[] => [...mediaKeys];
