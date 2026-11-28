import { useRouter } from '@tanstack/react-router';
import type { MouseEvent } from 'react';

/** Client-side navigation for links built from data (hrefs are plain paths, not typed routes). */
export function useGo() {
  const router = useRouter();
  return (href: string) => router.history.push(href);
}

/** onClick for an <a href>: lets modified clicks (new tab, etc.) through, otherwise navigates in-app. */
export function useLinkClick(onBefore?: () => void) {
  const go = useGo();
  return (e: MouseEvent<HTMLAnchorElement>) => {
    const a = e.currentTarget;
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === '_blank') return;
    e.preventDefault();
    onBefore?.();
    go(a.getAttribute('href') ?? '/');
  };
}
