import { getMySession, getSupabase, signOut } from '@brickbot/supabase';
import type { CmsClient } from './client';
import { fail, unwrap } from './live-kit';
import type { ActivityItem, PublishStatus, SeasonSummary, Session } from './types';
import { PERMISSIONS } from '../modules';

/** A session that is gone, expired or rejected reads as "no session" (the app sends the visitor to auth). */
function isGone(e: unknown): boolean {
  const x = e as { code?: string; message?: string; name?: string } | null;
  return !!x && (x.code === 'PGRST301' || x.code === 'PGRST303' || /jwt|refresh token|session/i.test(x.message ?? '') || /^Auth/.test(x.name ?? ''));
}

const IDLE: PublishStatus = { state: 'live', lastPublishedAt: null, lastDurationSec: null, targets: [], startedAt: null, waiting: { website: 0, links: 0 } };

export const liveClient: CmsClient = {
  preview: false,
  canPublish: false,

  async getSession(): Promise<Session | null> {
    try {
      const s = await getMySession();
      if (!s || !s.verified) return null;
      return { email: s.email, permissions: PERMISSIONS.filter((p) => s.permissions.includes(p)) };
    } catch (e) {
      if (isGone(e)) return null;
      throw e;
    }
  },
  async signOut() {
    try { await signOut(); } catch { /* the local session is cleared either way */ }
    location.href = import.meta.env.VITE_AUTH_URL;
  },

  async listActivity() {
    const rows = await unwrap(getSupabase().from('activity').select('*').order('at', { ascending: false }).limit(40));
    return rows.map((r): ActivityItem => ({
      id: r.id, actorEmail: r.actor_email, action: r.action, targetLabel: r.target_label,
      detail: r.detail ?? undefined, module: r.module, href: r.href, at: r.at,
    }));
  },
  logActivity(entry) {
    void Promise.resolve(getSupabase().from('activity').insert({
      action: entry.action, target_label: entry.targetLabel, detail: entry.detail ?? null, module: entry.module, href: entry.href,
    })).then(({ error }) => { if (error) console.warn('Could not log activity:', error.message); },
      (e) => console.warn('Could not log activity:', e));
  },

  async getPublishStatus() {
    const { data, error } = await getSupabase().rpc('publish_status');
    // An admin without cms.* may not read publish state: show it idle rather than failing.
    if (error?.code === '42501') return IDLE;
    if (error) return fail(error);
    return data as unknown as PublishStatus;
  },
  publish() {
    return Promise.reject(new Error('Publishing turns on once the website reads from the CMS.'));
  },

  async listSeasons() {
    const rows = await unwrap(getSupabase().from('season_summaries').select('id, game, years, current'));
    return rows.map((r): SeasonSummary => ({ id: r.id ?? '', game: r.game ?? '', years: r.years ?? '', current: !!r.current }));
  },
};
