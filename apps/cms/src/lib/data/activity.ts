import { cms } from './index';
import type { ActivityEntry } from './types';

/**
 * Call after every successful mutation, from the module's data layer (preview.ts, later the Supabase implementation):
 *
 *   logActivity({ action: 'edited project', targetLabel: p.name.en, module: 'Projects', href: `/projects/${p.id}` });
 *
 * The actor is the signed-in member's email; the UI shows "You" for the current member. `action` is a verb phrase that
 * reads after the actor ("edited project", "deleted sponsor"), `targetLabel` is the bold thing acted on, `detail` is
 * optional plain text after it, `module` is the tag on the row, `href` is where the row leads.
 */
export function logActivity(entry: ActivityEntry): void {
  cms.logActivity(entry);
}
