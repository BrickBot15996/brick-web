import type { Permission } from '../modules';

/** Who is signed in. Accounts carry only an email (PRODUCT.md): there is no display name. */
export interface Session {
  email: string;
  permissions: Permission[];
}

export type Bilingual = { en: string; ro: string };

/** One line of "Lately on the team". In production this is a view over the audit log. */
export interface ActivityItem {
  id: string;
  actorEmail: string;
  /** Verb phrase after the actor: "edited sponsor", "saved a draft of", "published". */
  action: string;
  /** The thing acted on, shown bold: "Banca Transilvania". */
  targetLabel: string;
  /** Plain text after the target, e.g. "built in 1 min 24 s". */
  detail?: string;
  /** Module tag shown on the row ("Projects", "Short URLs"). */
  module: string;
  /** App path the row links to. */
  href: string;
  /** ISO timestamp. */
  at: string;
}
/** What a module hands to `logActivity`: the data layer adds the actor (the session's email), the id and the time. */
export type ActivityEntry = Pick<ActivityItem, 'action' | 'targetLabel' | 'detail' | 'module' | 'href'>;

export type PublishTarget = 'website' | 'links';
export type PublishState = 'live' | 'building' | 'failed';

export interface PublishStatus {
  state: PublishState;
  /** ISO time of the last successful publish, null if never. */
  lastPublishedAt: string | null;
  lastDurationSec: number | null;
  /** What the current or last run covers. */
  targets: PublishTarget[];
  /** ISO time the running build started (state "building"). */
  startedAt: string | null;
  /** Changes saved since each site was last published (derived from the activity log). */
  waiting: Record<PublishTarget, number>;
}

/** Who last touched a saved item: an email (shown as "You" for the signed-in member) and when. */
export interface Edited { editedBy: string; editedAt: string }

/** Read-only reference list of seasons for pickers and filters (newest first). The Seasons module owns the real records. */
export interface SeasonSummary { id: string; game: string; years: string; current: boolean }
