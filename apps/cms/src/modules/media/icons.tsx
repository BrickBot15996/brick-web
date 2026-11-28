import type { SVGProps } from 'react';

/** Icons this module needs that the shared set lacks (same 24 grid, 1.8 stroke via the .i class). */
const paths = {
  copy: 'M9 9h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V10a1 1 0 0 1 1-1ZM16 9V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3',
  grid: 'M4 4h6v6H4ZM14 4h6v6h-6ZM4 14h6v6H4ZM14 14h6v6h-6Z',
  rows: 'M4 6h16M4 12h16M4 18h16',
  upload: 'M12 16V4m0 0-4 4m4-4 4 4M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4',
  folder: 'M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z',
  chevron: 'm9 6 6 6-6 6',
  play: 'M8 5v14l11-7Z',
  youtube: 'M3 8a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3ZM10 9v6l5-3Z',
} as const;
export type LocalIcon = keyof typeof paths;
export function LIcon({ name, ...rest }: { name: LocalIcon } & Omit<SVGProps<SVGSVGElement>, 'name'>) {
  return <svg className="i" viewBox="0 0 24 24" aria-hidden="true" {...rest}><path d={paths[name]} /></svg>;
}
