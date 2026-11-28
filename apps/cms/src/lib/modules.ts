import type { IconName } from '../components/icons';

export type Permission = 'cms.website' | 'cms.links' | 'admin';
/** What a module asks for: one permission, "any cms.*", or "any" (every signed-in member). */
export type Requirement = Permission | 'cms.*' | 'any';
export type ModuleGroup = 'general' | 'website' | 'links' | 'admin';

export interface CmsModule {
  id: string;
  label: string;
  path: string;
  icon: IconName;
  requires: Requirement;
  group: ModuleGroup;
  /** What it is for, one short line (palette hints, placeholders). */
  blurb: string;
}

/** Every module of CLAUDE.md §5 plus Home, in rail order. */
export const MODULES: CmsModule[] = [
  { id: 'home', label: 'Home', path: '/', icon: 'home', requires: 'any', group: 'general', blurb: 'Jump anywhere, see what changed.' },
  { id: 'blog', label: 'Blog', path: '/blog', icon: 'blog', requires: 'cms.website', group: 'website', blurb: 'BrickLog posts in EN and RO.' },
  { id: 'seasons', label: 'Seasons', path: '/seasons', icon: 'seasons', requires: 'cms.website', group: 'website', blurb: 'Games, events, results, awards.' },
  { id: 'team', label: 'Team & story', path: '/team', icon: 'team', requires: 'cms.website', group: 'website', blurb: 'Timeline, mission, impact numbers, Join page.' },
  { id: 'gallery', label: 'Gallery', path: '/gallery', icon: 'gallery', requires: 'cms.website', group: 'website', blurb: 'Photos, clips and YouTube embeds.' },
  { id: 'projects', label: 'Projects', path: '/projects', icon: 'projects', requires: 'cms.website', group: 'website', blurb: 'Project pages and BrickLog project tags.' },
  { id: 'support', label: 'Support', path: '/support', icon: 'support', requires: 'cms.website', group: 'website', blurb: 'Sponsors, tiers, deck, budget.' },
  { id: 'home-faq', label: 'Home & FAQ', path: '/home-faq', icon: 'faq', requires: 'cms.website', group: 'website', blurb: 'Hero media, FAQ, Form 230 dates.' },
  { id: 'press', label: 'Press kit', path: '/press', icon: 'press', requires: 'cms.website', group: 'website', blurb: 'Logos, photos and descriptions for press.' },
  { id: 'settings', label: 'Site settings', path: '/settings', icon: 'settings', requires: 'cms.website', group: 'website', blurb: 'Contact, address, association details, socials.' },
  { id: 'linktree', label: 'Linktree', path: '/linktree', icon: 'link', requires: 'cms.links', group: 'links', blurb: 'Link cards and social icons.' },
  { id: 'short-urls', label: 'Short URLs', path: '/short-urls', icon: 'short', requires: 'cms.links', group: 'links', blurb: 'brickbot.ro/<slug> redirects.' },
  { id: 'media', label: 'Media library', path: '/media', icon: 'media', requires: 'cms.*', group: 'general', blurb: 'Browse and upload files.' },
  { id: 'users', label: 'Users', path: '/admin/users', icon: 'users', requires: 'admin', group: 'admin', blurb: 'Invite, deactivate, reactivate.' },
  { id: 'permissions', label: 'Permissions', path: '/admin/permissions', icon: 'key', requires: 'admin', group: 'admin', blurb: 'Who can do what.' },
  { id: 'audit', label: 'Audit log', path: '/admin/audit', icon: 'log', requires: 'admin', group: 'admin', blurb: 'Who changed what, and when.' },
];

export const GROUP_LABEL: Record<ModuleGroup, string> = { general: 'General', website: 'Website', links: 'Links', admin: 'Admin' };

export function hasCms(permissions: readonly string[]): boolean {
  return permissions.some((p) => p.startsWith('cms.'));
}

export function can(permissions: readonly string[], req: Requirement): boolean {
  if (req === 'any') return permissions.length > 0;
  return req === 'cms.*' ? hasCms(permissions) : permissions.includes(req);
}

/** The modules a member may see, in rail order. */
export function modulesFor(permissions: readonly string[]): CmsModule[] {
  return MODULES.filter((m) => can(permissions, m.requires));
}

export function moduleById(id: string): CmsModule | undefined {
  return MODULES.find((m) => m.id === id);
}

/** Longest matching module for a pathname (so /projects/abc is "Projects"). */
export function moduleForPath(pathname: string): CmsModule | undefined {
  if (pathname === '/') return MODULES[0];
  return MODULES.filter((m) => m.path !== '/' && (pathname === m.path || pathname.startsWith(m.path + '/'))).sort((a, b) => b.path.length - a.path.length)[0];
}

/** Home chips: the 6 most-used modules the member may see (website first, then links, then admin). */
const CHIP_ORDER = ['blog', 'seasons', 'gallery', 'support', 'linktree', 'media', 'projects', 'short-urls', 'users', 'permissions', 'audit', 'team', 'press', 'settings', 'home-faq'];
export function chipModules(permissions: readonly string[], n = 6): CmsModule[] {
  const allowed = modulesFor(permissions).filter((m) => m.id !== 'home');
  return CHIP_ORDER.map((id) => allowed.find((m) => m.id === id)).filter((m): m is CmsModule => !!m).slice(0, n);
}

export const PERMISSIONS: Permission[] = ['cms.website', 'cms.links', 'admin'];
