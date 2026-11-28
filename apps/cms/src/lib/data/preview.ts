import type { CmsClient } from './client';
import { seasonSummaries } from '../../modules/seasons/data/store';
import { dayAt, minsAgo as ago, nowIso, PREVIEW_ME as ME, previewDelay, previewFlag as flag } from './preview-kit';
import type { ActivityItem, PublishStatus, PublishTarget, Session } from './types';
import { PERMISSIONS } from '../modules';
import type { Permission } from '../modules';

// The core preview store. It lives in memory, so a reload starts again from the seed.

function previewPermissions(): Permission[] {
  const raw = flag('perms');
  if (!raw) return [...PERMISSIONS];
  const wanted = raw.split(',').map((p) => p.trim());
  return PERMISSIONS.filter((p) => wanted.includes(p));
}

// ───────── activity: dates are relative to "now" so the groups always read Today / Yesterday / Earlier ─────────
const ana = 'ana.popescu@brickbot.ro', matei = 'matei.ionescu@brickbot.ro', ioana = 'ioana.radu@brickbot.ro', vlad = 'vlad.stan@brickbot.ro';

const activity: ActivityItem[] = [
  { id: 'a1', actorEmail: ana, action: 'edited sponsor', targetLabel: 'Banca Transilvania', module: 'Support', href: '/support/sponsors/banca-transilvania', at: ago(12) },
  { id: 'a2', actorEmail: matei, action: 'saved a draft of', targetLabel: 'Worlds, from the pit', module: 'Blog', href: '/blog/worlds-from-the-pit', at: ago(40) },
  { id: 'a3', actorEmail: ioana, action: 'uploaded 14 photos to', targetLabel: 'DECODE', module: 'Gallery', href: '/gallery', at: ago(65) },
  { id: 'a4', actorEmail: vlad, action: 'set a result for', targetLabel: 'Bucharest Twin Cup', detail: 'to Finalist', module: 'Seasons', href: '/seasons/decode', at: ago(185) },
  { id: 'a5', actorEmail: ME, action: 'published', targetLabel: 'the website', detail: '· built in 1 min 24 s', module: 'Publish', href: '/', at: dayAt(1, '18:42') },
  { id: 'a6', actorEmail: ana, action: 'added link card', targetLabel: 'Redirect 3.5% of your tax', module: 'Linktree', href: '/linktree', at: dayAt(1, '16:05') },
  { id: 'a7', actorEmail: ME, action: 'edited project', targetLabel: 'BrickBot Caravan', module: 'Projects', href: '/projects/brickbot-caravan', at: dayAt(1, '14:30') },
  { id: 'a8', actorEmail: matei, action: 'scheduled', targetLabel: 'Welcome, new recruits', module: 'Blog', href: '/blog/new-recruits-welcome', at: dayAt(1, '11:12') },
  { id: 'a9', actorEmail: vlad, action: 'added sponsor', targetLabel: 'Unior', module: 'Support', href: '/support/sponsors/unior', at: dayAt(2, '17:48') },
  { id: 'a10', actorEmail: ioana, action: 'changed the short URL', targetLabel: '/apply', module: 'Short URLs', href: '/short-urls', at: dayAt(3, '20:15') },
  { id: 'a11', actorEmail: ME, action: 'edited season', targetLabel: 'DECODE 2025–26', module: 'Seasons', href: '/seasons/decode', at: dayAt(3, '15:20') },
  { id: 'a12', actorEmail: ana, action: 'published', targetLabel: 'DECODE: what we learned this season', module: 'Blog', href: '/blog/decode-season-so-far', at: dayAt(4, '19:02') },
];

// ───────── publish: building for ~6 s, then live (?fail=publish refuses the request, ?fail=build fails the build) ─────────
const BUILD_MS = 6000;
type BaseStatus = Omit<PublishStatus, 'waiting'>;
let publishStatus: BaseStatus = { state: 'live', lastPublishedAt: dayAt(1, '18:42'), lastDurationSec: 84, targets: ['website'], startedAt: null };
/** When each site last went live; "changes waiting" counts activity saved after it. */
const publishedAt: Record<PublishTarget, string> = { website: dayAt(1, '18:42'), links: dayAt(1, '18:42') };

/** Which sites a logged change touches. Media, accounts and publishes themselves never wait for a build. */
function sitesOf(module: string): PublishTarget[] {
  if (module === 'Linktree') return ['links'];
  if (module === 'Site settings') return ['website', 'links'];
  if (['Media', 'Users', 'Permissions', 'Publish', 'Audit log'].includes(module)) return [];
  return ['website'];
}
function withWaiting(s: BaseStatus): PublishStatus {
  const waiting: Record<PublishTarget, number> = { website: 0, links: 0 };
  for (const a of activity) for (const t of sitesOf(a.module)) if (a.at > publishedAt[t]) waiting[t]++;
  return { ...s, waiting };
}

export const previewClient: CmsClient = {
  preview: true,
  canPublish: true,

  async getSession(): Promise<Session> {
    await previewDelay();
    return { email: ME, permissions: previewPermissions() };
  },
  async signOut() {
    try { sessionStorage.clear(); } catch { /* nothing to clear */ }
    location.href = import.meta.env.VITE_AUTH_URL;
  },

  async listActivity() {
    await previewDelay();
    if (flag('fail') === 'activity') throw new Error('Could not load activity');
    return [...activity].sort((a, b) => b.at.localeCompare(a.at));
  },
  /** Every write leaves a line in "Lately on the team". */
  logActivity(entry) {
    activity.unshift({ id: `w${Date.now()}${Math.random().toString(36).slice(2, 6)}`, actorEmail: ME, ...entry, at: nowIso() });
  },

  async getPublishStatus() {
    return withWaiting(publishStatus);
  },
  async publish(targets: PublishTarget[]) {
    await previewDelay();
    // ?fail=publish: the request itself is refused, so the Publish popover shows the error. (?fail=build: the build starts and then fails.)
    if (flag('fail') === 'publish') throw new Error('The build could not be started. Try again in a moment.');
    if (publishStatus.state === 'building') return withWaiting(publishStatus);
    const startedAt = new Date();
    const startIso = startedAt.toISOString();
    publishStatus = { ...publishStatus, state: 'building', targets, startedAt: startedAt.toISOString() };
    setTimeout(() => {
      if (flag('fail') === 'build') {
        publishStatus = { ...publishStatus, state: 'failed', startedAt: null };
      } else {
        for (const t of targets) publishedAt[t] = startIso;
        publishStatus = { state: 'live', lastPublishedAt: new Date().toISOString(), lastDurationSec: Math.round((Date.now() - startedAt.getTime()) / 1000), targets, startedAt: null };
        activity.unshift({ id: `p${Date.now()}`, actorEmail: ME, action: 'published', targetLabel: targets.length === 2 ? 'the website and links' : targets[0] === 'links' ? 'the linktree' : 'the website', detail: `· built in ${publishStatus.lastDurationSec} s`, module: 'Publish', href: '/', at: nowIso() });
      }
    }, BUILD_MS);
    return withWaiting(publishStatus);
  },

  async listSeasons() { await previewDelay(); return seasonSummaries(); },
};
