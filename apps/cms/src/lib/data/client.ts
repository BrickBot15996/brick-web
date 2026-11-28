import type { ActivityEntry, ActivityItem, PublishStatus, PublishTarget, SeasonSummary, Session } from './types';

/**
 * The CORE of what the CMS reads and writes: session, activity, publish, the season reference list. Today only the
 * in-memory `preview` implementation exists (Supabase is not set up yet, see SETUP.md); the real one will sit next to it
 * and implement the same contract. Screens never import an implementation, only `cms` from ./index and the hooks.
 *
 * Module data does NOT go here. Each module declares its own interface and preview store in modules/<id>/data/, wires
 * them with `defineApi` (./module) and writes through `logActivity` (./activity). See src/modules/README.md.
 *
 * A mutation that breaks a rule (a taken slug) rejects with an Error whose message is safe to show.
 */
export interface CmsClient {
  /** True while running on the in-memory sample data. */
  readonly preview: boolean;
  /**
   * Whether publishing runs at all. True in preview. False in the live client until the website reads from the CMS, and
   * when unconfigured: the header then shows a quiet "Saved · publishing not connected yet" instead of the Publish button.
   */
  readonly canPublish: boolean;
  /** The signed-in member, or null when there is no session (the app then sends them to auth). */
  getSession(): Promise<Session | null>;
  signOut(): Promise<void>;

  listActivity(): Promise<ActivityItem[]>;
  /**
   * Records "who did what" for the home feed, attributed to the signed-in member. Fire and forget. In preview it adds a
   * row; in production the audit-log triggers write the real rows, so this becomes a no-op there.
   */
  logActivity(entry: ActivityEntry): void;

  getPublishStatus(): Promise<PublishStatus>;
  publish(targets: PublishTarget[]): Promise<PublishStatus>;

  /** Newest first. Read-only reference data for pickers and filters. */
  listSeasons(): Promise<SeasonSummary[]>;
}
