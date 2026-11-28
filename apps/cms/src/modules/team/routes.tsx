import { createRoute, redirect, lazyRouteComponent } from '@tanstack/react-router';
import type { AnyRoute } from '@tanstack/react-router';
import { TabbedModule } from '../../components/edit';
import type { ModuleTab } from '../../components/edit';

const TABS: ModuleTab[] = [
  { href: '/team/timeline', label: 'Timeline' },
  { href: '/team/mission', label: 'Mission' },
  { href: '/team/impact', label: 'Impact numbers' },
  { href: '/team/join', label: 'Join page' },
];

/** /team: tab row over Timeline (list → edit), Mission, Impact numbers and Join page (single records). */
export function teamRoutes(parent: AnyRoute): AnyRoute[] {
  const team = createRoute({ getParentRoute: () => parent, path: '/team', component: () => <TabbedModule label="Team & story sections" tabs={TABS} /> });
  const timeline = createRoute({ getParentRoute: () => team, path: 'timeline', component: lazyRouteComponent(() => import('./Timeline'), 'TimelineLayout') });
  return [team.addChildren([
    createRoute({ getParentRoute: () => team, path: '/', beforeLoad: () => { throw redirect({ to: '/team/timeline' }); } }),
    timeline.addChildren([
      createRoute({ getParentRoute: () => timeline, path: '/', component: lazyRouteComponent(() => import('./Timeline'), 'TimelineIndex') }),
      createRoute({ getParentRoute: () => timeline, path: 'new', component: lazyRouteComponent(() => import('./Timeline'), 'MilestoneNew') }),
      createRoute({ getParentRoute: () => timeline, path: '$id', component: lazyRouteComponent(() => import('./Timeline'), 'MilestoneEdit') }),
    ]),
    createRoute({ getParentRoute: () => team, path: 'mission', component: lazyRouteComponent(() => import('./MissionTab'), 'MissionTab') }),
    createRoute({ getParentRoute: () => team, path: 'impact', component: lazyRouteComponent(() => import('./ImpactTab'), 'ImpactTab') }),
    createRoute({ getParentRoute: () => team, path: 'join', component: lazyRouteComponent(() => import('./JoinTab'), 'JoinTab') }),
  ])];
}
