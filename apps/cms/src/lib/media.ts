import { useSyncExternalStore } from 'react';

/** Subscribes to a CSS media query. */
export function useMedia(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query);
      m.addEventListener('change', cb);
      return () => m.removeEventListener('change', cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Desktop layout: the icon rail. Below this, the top bar and the menu sheet. */
export const WIDE = '(min-width: 900px)';

/** Wide enough for the rail to show labels: the list, the editor and the open rail all fit (list 380 + editor 580 + rail 240). */
export const ROOMY = '(min-width: 1200px)';
