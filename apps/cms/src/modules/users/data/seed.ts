/**
 * SAMPLE DATA. Real emails of the activity feed seed (ana, matei, ioana, vlad) plus invented @brickbot.ro ones.
 * The permission catalog mirrors CLAUDE.md §2.
 */
import { daysAgo, minsAgo } from '../../../lib/data/preview-kit';
import type { AdminUser, PermissionDef } from './types';

export const catalog: PermissionDef[] = [
  { id: 'cms.website', label: 'Website content', description: 'Edit the website’s content: posts, seasons, gallery, projects, sponsors, press kit and settings.' },
  { id: 'cms.links', label: 'Linktree and short URLs', description: 'Edit the linktree cards and the brickbot.ro short URLs.' },
  { id: 'admin', label: 'Admin', description: 'Manage members, permissions and the audit log. It does not allow editing content.' },
];

const W = 'cms.website', L = 'cms.links', A = 'admin';
const u = (n: number, email: string, permissions: string[], status: AdminUser['status'], lastSignInAt: string | null, addedAt: string): AdminUser =>
  ({ id: `u${n}`, email: `${email}@brickbot.ro`, permissions, status, lastSignInAt, addedAt });

export const users: AdminUser[] = [
  u(1, 'maria.popescu', [W, L, A], 'active', minsAgo(3), daysAgo(420)),
  u(2, 'ana.popescu', [W, L], 'active', minsAgo(12), daysAgo(380)),
  u(3, 'matei.ionescu', [W], 'active', minsAgo(40), daysAgo(310)),
  u(4, 'ioana.radu', [W], 'active', minsAgo(65), daysAgo(300)),
  u(5, 'vlad.stan', [W, L], 'active', minsAgo(185), daysAgo(280)),
  u(6, 'cristina.badea', [A], 'active', daysAgo(2, 9), daysAgo(260)),
  u(7, 'andrei.munteanu', [W], 'active', daysAgo(1, 17), daysAgo(210)),
  u(8, 'elena.dumitru', [L], 'active', daysAgo(5, 20), daysAgo(190)),
  u(9, 'radu.tudor', [L], 'active', daysAgo(9, 12), daysAgo(150)),
  u(10, 'bianca.marin', [W], 'active', daysAgo(3, 18), daysAgo(120)),
  u(11, 'stefan.neagu', [W, A], 'active', daysAgo(14, 10), daysAgo(95)),
  u(12, 'diana.lupu', [W, L], 'active', daysAgo(6, 16), daysAgo(60)),
  u(13, 'tudor.georgescu', [W], 'invited', null, daysAgo(2, 14)),
  u(14, 'alex.constantin', [W], 'deactivated', daysAgo(120, 11), daysAgo(340)),
];
