import type { AnchorHTMLAttributes } from 'react';
import { useLinkClick } from '../lib/nav';

/** An in-app link for hrefs built from data. Modified clicks still open a new tab. */
export function AppLink({ href, onClick, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const click = useLinkClick();
  return <a href={href} onClick={(e) => { onClick?.(e); click(e); }} {...rest} />;
}
