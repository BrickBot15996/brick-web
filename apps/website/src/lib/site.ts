/** Site-wide facts. Later read from the CMS "Site settings" (CLAUDE.md §5); one source of truth with links. */
export type Locale = 'en' | 'ro';

/** Translated routes (CLAUDE.md §3 sitemap). */
export const routes = {
  home: { en: '/en/', ro: '/ro/' },
  about: { en: '/en/about/', ro: '/ro/despre/' },
  team: { en: '/en/team/', ro: '/ro/echipa/' },
  gallery: { en: '/en/gallery/', ro: '/ro/galerie/' },
  seasons: { en: '/en/seasons/', ro: '/ro/sezoane/' },
  projects: { en: '/en/projects/', ro: '/ro/proiecte/' },
  blog: { en: '/en/blog/', ro: '/ro/blog/' },
  join: { en: '/en/join/', ro: '/ro/alatura-te/' },
  partners: { en: '/en/partners/', ro: '/ro/parteneri/' },
  donate: { en: '/en/donate/', ro: '/ro/doneaza/' },
  sponsors: { en: '/en/sponsors/', ro: '/ro/sponsori/' },
  press: { en: '/en/press/', ro: '/ro/presa/' },
  contact: { en: '/en/contact/', ro: '/ro/contact/' },
  terms: { en: '/en/terms/', ro: '/ro/termeni-si-conditii/' },
  privacy: { en: '/en/privacy/', ro: '/ro/politica-de-confidentialitate/' },
} as const satisfies Record<string, Record<Locale, string>>;

export type RouteId = keyof typeof routes;

export const site = {
  name: 'BrickBot',
  team: 15996,
  founded: 2016,
  email: 'contact@brickbot.ro',
  legalName: 'Asociația BrickBot',
  locality: 'Focșani',
  region: 'Vrancea',
  country: 'RO',
  socials: [
    { id: 'instagram', label: 'Instagram', href: 'https://instagram.com/brickbotcnu' },
    { id: 'facebook', label: 'Facebook', href: 'https://facebook.com/brickbotcnu' },
    { id: 'tiktok', label: 'TikTok', href: 'https://tiktok.com/@brickbotcnu' },
    { id: 'linkedin', label: 'LinkedIn', href: 'https://linkedin.com/company/brickbot' },
    { id: 'youtube', label: 'YouTube', href: 'https://youtube.com/channel/UCRpA5UNXSZDl2GmPt_E91ew' },
    { id: 'github', label: 'GitHub', href: 'https://github.com/BrickBot15996' },
  ],
  address: { street: '15 Cezar Bolliac Street', streetRo: 'Str. Cezar Bolliac nr. 15', city: 'Focșani', county: 'Vrancea', country: 'Romania', countryRo: 'România' },
  association: {
    name: 'Asociația BrickBot',
    cif: '50846996',
    bank: 'Banca Transilvania',
    branch: { en: 'Focșani branch', ro: 'Sucursala Focșani' },
    iban: 'RO05BTRLEURCRT0690572901',
  },
  /** External destinations (the short URLs in §3.12 point at the same places). */
  links: {
    apply: 'https://forms.gle/kr4LBrLzFzvTW4S18',
    form230: 'https://formular230.ro/asociatia-brickbot',
    stripe: 'https://donate.stripe.com/00w6oI2wK5wBfQT0Sw5J602',
    natie: 'https://natieprineducatie.ro',
    first: 'https://www.firstinspires.org/robotics/ftc',
    instagram: 'https://instagram.com/brickbotcnu',
    linkedin: 'https://linkedin.com/company/brickbot',
  },
  /** Google Business Profile map (SETUP.md "Google"). Falls back to an address search until the owner sets them. */
  maps: {
    embed: import.meta.env.PUBLIC_MAPS_EMBED_URL || 'https://www.google.com/maps?q=Strada%20Cezar%20Bolliac%2015%2C%20Foc%C8%99ani%2C%20Romania&output=embed',
    link: import.meta.env.PUBLIC_MAPS_LINK_URL || 'https://www.google.com/maps/search/?api=1&query=Strada%20Cezar%20Bolliac%2015%2C%20Foc%C8%99ani%2C%20Romania',
  },
  /** Documents managed in the CMS ("Support"). null until uploaded (docs/cdn-manifest.md); the UI then offers to email it. */
  documents: {
    deck: null as string | null,          // e.g. 'documents/sponsor-deck-2026-27.pdf'
    contract: null as string | null,      // e.g. 'documents/sample-contract.pdf'
  },
  /** Form 230 runs from the start of the year until 25 May (§3.8). */
  form230Deadline: { month: 5, day: 25 },
  /** Short URLs (CLAUDE.md §3.12), served by the website's _redirects. */
  short: { apply: '/apply' },
} as const;

/** True while Form 230 can still be filed this year. */
export function form230Open(now = new Date()): boolean {
  const { month, day } = site.form230Deadline;
  return now <= new Date(now.getFullYear(), month - 1, day, 23, 59, 59);
}
