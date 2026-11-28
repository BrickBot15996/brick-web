import type { SVGProps } from 'react';

/** Stroke icons, one weight (1.8) and one grid (24). Paths from the approved sketch. */
const paths = {
  home: 'M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z',
  blog: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z',
  seasons: 'M4 22V4M4 4h13l-2.5 4L17 12H4',
  team: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  gallery: 'M6 3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3ZM11 9a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM21 15l-5-5L5 21',
  projects: 'm12 2 10 5-10 5L2 7ZM2 17l10 5 10-5M2 12l10 5 10-5',
  support: 'M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z',
  press: 'M4 4h13v16H6a2 2 0 0 1-2-2ZM17 8h3v10a2 2 0 0 1-2 2M8 8h5M8 12h5M8 16h5',
  settings: 'M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1M17 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM11 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM19 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z',
  faq: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM3 9h18M9 21V9',
  link: 'M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7',
  short: 'm15 10 5 5-5 5M4 4v7a4 4 0 0 0 4 4h12',
  media: 'M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z',
  bolt: 'M13 2 4 14h7l-1 8 9-12h-7Z',
  users: 'M16 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21a8 8 0 0 1 16 0',
  key: 'M12 15.5a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM10.7 12.3 20 3M16 7l3 3',
  log: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  search: 'M18 11a7 7 0 1 1-14 0 7 7 0 0 1 14 0ZM21 21l-4.3-4.3',
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  menu: 'M4 7h16M4 12h16M4 17h16',
  close: 'M6 6l12 12M18 6 6 18',
  external: 'M14 4h6v6M20 4 10 14M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
  signout: 'M9 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4M16 17l5-5-5-5M21 12H9',
  check: 'm5 12 5 5 9-10',
  plus: 'M12 5v14M5 12h14',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3',
  up: 'm6 15 6-6 6 6',
  down: 'm6 9 6 6 6-6',
  reorder: 'M7 4v16m0 0-3-3m3 3 3-3M17 20V4m0 0-3 3m3-3 3 3',
  expand: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM9 3v18M13.5 9.5 16 12l-2.5 2.5',
  collapse: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM9 3v18M16 9.5 13.5 12l2.5 2.5',
  alert: 'M12 8v5M12 17h.01M10.3 3.9 2.4 17.5A2 2 0 0 0 4.1 20.5h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
  file: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8ZM14 3v5h5M9 13h6M9 17h6',
  video: 'M3 6h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2ZM17 10l5-3v10l-5-3',
  calendar: 'M7 3v4M17 3v4M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z',
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, ...rest }: { name: IconName } & Omit<SVGProps<SVGSVGElement>, 'name'>) {
  return (
    <svg className="i" viewBox="0 0 24 24" aria-hidden="true" {...rest}>
      <path d={paths[name]} />
    </svg>
  );
}
