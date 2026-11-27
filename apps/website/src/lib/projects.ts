/**
 * Projects (CLAUDE.md §3.10), later read from the CMS at build time. Each project has its own page at
 * /en/projects/{slug}/ and /ro/proiecte/{slug}/, except an `external` one, whose card links straight out.
 *
 * Logos live at `projects/{slug}/logo.svg` on the CDN (docs/cdn-manifest.md). Until one is uploaded, `logo` is null and
 * the team logo stands in for it.
 */
import type { Locale } from './site';

type T = Record<Locale, string>;
/** A big number on the impact board, e.g. { value: '1,200+', label: { en: 'People reached', … } }. */
export interface Stat { value: string; label: T }
/** One line of the "at a glance" list, e.g. Started: 2023, How often: every autumn, Who it's for, Where. */
export interface Fact { label: T; value: T }
export interface Photo { key: string; width: number; height: number; alt: T; caption?: T }
/** Someone who makes the project possible: co-organiser, host, sponsor. */
export interface Partner { name: string; logo?: string; href?: string }

export interface Project {
  id: string;                      // also the BrickLog project tag id
  slug: string;                    // same in both languages: the names are proper names
  name: T;
  summary: T;                      // one sentence: the card text, the page lede and the meta description
  logo: string | null;             // CDN key
  external?: string;               // no page of its own: the card goes here
  // Every field below is optional; a section without content is left out of the page.
  stats?: Stat[];                  // impact numbers, up to 4
  body?: Record<Locale, string[]>; // the longer description, one string per paragraph
  facts?: Fact[];
  photos?: Photo[];                // the first one is shown largest
  partners?: Partner[];
  sample?: boolean;                // set by withSample() in development only
}

export const projects: Project[] = [
  {
    id: 'focsani-tech-challenge', slug: 'focsani-tech-challenge', logo: null,
    name: { en: 'Focșani Tech Challenge', ro: 'Focșani Tech Challenge' },
    summary: {
      en: 'A league meet we organise every year to bring the teams from our area to our town.',
      ro: 'O etapă de ligă pe care o organizăm în fiecare an, ca să aducem echipele din zonă în orașul nostru.',
    },
  },
  {
    id: 'brick-by-brick-school', slug: 'brick-by-brick-school', logo: null,
    name: { en: 'Brick By Brick School', ro: 'Brick By Brick School' },
    summary: {
      en: 'Our structured preparation programme for new recruits.',
      ro: 'Programul nostru structurat de pregătire pentru recruți.',
    },
  },
  {
    id: 'brickbot-caravan', slug: 'brickbot-caravan', logo: null,
    name: { en: 'BrickBot Caravan', ro: 'BrickBot Caravan' },
    summary: {
      en: 'A series of visits and presentations in the schools of our town.',
      ro: 'O serie de vizite și prezentări în școlile din orașul nostru.',
    },
  },
  {
    id: 'first-steps-into-steam', slug: 'first-steps-into-steam', logo: null,
    name: { en: 'FIRST Steps Into STEAM', ro: 'FIRST Steps Into STEAM' },
    summary: {
      en: 'Technical and non-technical workshops that introduce secondary school students from rural areas to STEAM education.',
      ro: 'Ateliere tehnice și non-tehnice prin care le prezentăm educația STEAM elevilor de gimnaziu din mediul rural.',
    },
  },
  {
    id: 'ftc-sparks', slug: 'ftc-sparks', logo: null,
    name: { en: 'FTC Sparks', ro: 'FTC Sparks' },
    summary: {
      en: 'Online meetups with teams from all over the world, where we share our experiences and perspectives.',
      ro: 'Întâlniri online cu echipe din toată lumea, în care ne împărtășim experiențele și perspectivele.',
    },
  },
  {
    id: 'brickdocs', slug: 'brickdocs', logo: null, external: 'https://docs.brickbot.ro',
    name: { en: 'BrickDocs', ro: 'BrickDocs' },
    summary: {
      en: 'Our documentation platform, where we collect everything we know.',
      ro: 'Platforma noastră de documentație, unde adunăm tot ce știm.',
    },
  },
];

/** Projects that get a page of their own. */
export const projectPages = projects.filter((p) => !p.external);

/**
 * Development only: a project with no page content yet gets clearly marked placeholder content, so the page layout can
 * be reviewed. Production builds never call this with DEV set, and the page shows a "sample" notice when it applies.
 */
export function withSample(p: Project): Project {
  if (!import.meta.env.DEV || p.stats?.length || p.body || p.photos?.length) return p;
  return {
    ...p, sample: true,
    stats: [
      { value: '1,200+', label: { en: 'People reached', ro: 'Persoane implicate' } },
      { value: '4', label: { en: 'Editions', ro: 'Ediții' } },
      { value: '18', label: { en: 'Schools', ro: 'Școli' } },
    ],
    body: {
      en: [
        'This is where the longer description goes. Start with why the project exists: the problem you saw, or the people you wanted to reach.',
        'Then say what actually happens. Who takes part, what they do on the day, how long it runs and how the team prepares it.',
        'End with what changed because of it: what participants went on to do, what you learned, and what the next edition will do differently.',
      ],
      ro: [
        'Aici vine descrierea lungă. Începe cu motivul pentru care există proiectul: problema pe care ați observat-o sau oamenii la care voiați să ajungeți.',
        'Apoi spune ce se întâmplă de fapt. Cine participă, ce fac în ziua respectivă, cât durează și cum îl pregătește echipa.',
        'Încheie cu ce s-a schimbat datorită lui: ce au făcut participanții mai departe, ce ați învățat și ce va face altfel ediția următoare.',
      ],
    },
    facts: [
      { label: { en: 'Started', ro: 'Început' }, value: { en: '2023', ro: '2023' } },
      { label: { en: 'How often', ro: 'Cât de des' }, value: { en: 'Every year', ro: 'În fiecare an' } },
      { label: { en: 'Who it’s for', ro: 'Pentru cine' }, value: { en: 'Secondary school students', ro: 'Elevi de gimnaziu' } },
      { label: { en: 'Where', ro: 'Unde' }, value: { en: 'Focșani', ro: 'Focșani' } },
    ],
    photos: [
      { key: 'site/home/schools-classroom.webp', width: 1280, height: 960, alt: { en: 'Sample photo', ro: 'Fotografie exemplu' }, caption: { en: 'A caption can sit under any photo.', ro: 'Orice fotografie poate avea o descriere.' } },
      { key: 'site/home/joy-in-motion.webp', width: 1680, height: 1120, alt: { en: 'Sample photo', ro: 'Fotografie exemplu' } },
      { key: 'site/home/schools-video.webp', width: 1280, height: 854, alt: { en: 'Sample photo', ro: 'Fotografie exemplu' } },
      { key: 'site/join/sparkhope-2025.webp', width: 1280, height: 851, alt: { en: 'Sample photo', ro: 'Fotografie exemplu' } },
      { key: 'gallery/decode/worlds-practice-field.webp', width: 1600, height: 1069, alt: { en: 'Sample photo', ro: 'Fotografie exemplu' } },
    ],
    partners: [
      { name: 'Micromet', logo: 'sponsors/micromet.svg', href: 'https://www.micromet.ro/' },
      { name: 'Primăria Municipiului Focșani', logo: 'sponsors/primaria.webp', href: 'https://www.focsani.info' },
      { name: 'Banca Transilvania', logo: 'sponsors/banca-transilvania.webp', href: 'https://www.bancatransilvania.ro' },
    ],
  };
}
export const projectLogo = (p: Project) => p.logo ?? 'brand/logo.svg';
