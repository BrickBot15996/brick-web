import type { AuditTable, AuditValue } from './types';

/** Readable names of the tables the triggers watch. Unknown tables fall back to a prettified name. */
const TABLES: Record<string, string> = {
  blog_posts: 'Blog posts',
  seasons: 'Seasons',
  season_events: 'Season events',
  awards: 'Awards',
  sponsors: 'Sponsors',
  projects: 'Projects',
  gallery_items: 'Gallery',
  short_urls: 'Short URLs',
  link_cards: 'Linktree cards',
  site_settings: 'Site settings',
  press_kit: 'Press kit',
  press_assets: 'Press kit',
  faq_items: 'FAQ',
  user_permissions: 'Permissions',
  users: 'Members',
  members: 'Members',
  season_event_overrides: 'Event results',
  blog_topics: 'Blog topics',
  timeline_milestones: 'Timeline',
  departments: 'Departments',
  sponsor_tiers: 'Sponsor tiers',
  sponsor_benefits: 'Sponsor benefits',
  sponsor_decks: 'Sponsor decks',
  season_budgets: 'Season budgets',
  budget_lines: 'Budget lines',
  team_page: 'Team page',
  join_page: 'Join page',
  impact_numbers: 'Impact numbers',
  support_docs: 'Support documents',
  home_hero: 'Home hero',
  form230_callout: 'Form 230 callout',
  social_links: 'Social links',
};
const FIELDS: Record<string, string> = {
  title: 'Title', status: 'Status', topics: 'Topics', season: 'Season', slug: 'Slug', name: 'Name', tier: 'Tier', website: 'Website', url: 'Target URL',
  summary: 'Summary', current: 'Current season', result: 'Result', award: 'Award', event: 'Event', published_at: 'Publish date', featured: 'Featured', caption: 'Caption',
  permissions: 'Permissions', email: 'Email', banned: 'Blocked', question: 'Question', answer: 'Answer', iban: 'IBAN', address: 'Address', starts_on: 'Start date', ends_on: 'End date',
  highlighted: 'Highlighted', description: 'Description', display_url: 'Shown as', cif: 'CIF', contact_email: 'Contact email', position: 'Position', year: 'Year', rank: 'Rank',
};

const pretty = (s: string) => { const t = s.replace(/_/g, ' '); return t.charAt(0).toUpperCase() + t.slice(1); };
export const tableLabel = (t: string) => TABLES[t] ?? pretty(t);
export const fieldLabel = (f: string) => FIELDS[f] ?? pretty(f);
export const knownTables = (): AuditTable[] => Object.entries(TABLES).map(([id, label]) => ({ id, label }));

/** Plain text for a value in the diff. Lists join with commas; booleans read Yes / No; empty reads "empty". */
export function showValue(v: AuditValue | undefined): string {
  if (v === undefined || v === null || v === '') return 'empty';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (Array.isArray(v)) return v.length ? v.join(', ') : 'none';
  if (typeof v === 'object') return `${v.en || 'empty'} / ${v.ro || 'empty'}`;
  return String(v);
}
