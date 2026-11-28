import type { ReactNode } from 'react';

/**
 * The one small status tag: Condensed caps on the raised board. Neutral is ink-muted; `lit` is yellow text with a 1px
 * yellow hairline (never a yellow fill, which belongs to primary actions).
 */
export function Tag({ children, lit, className, decorative }: { children: ReactNode; lit?: boolean; className?: string; decorative?: boolean }) {
  return <span aria-hidden={decorative || undefined} className={`tag${lit ? ' tag--lit' : ''}${className ? ` ${className}` : ''}`}>{children}</span>;
}
