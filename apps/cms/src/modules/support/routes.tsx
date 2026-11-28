import { createRoute, redirect, lazyRouteComponent } from '@tanstack/react-router';
import type { AnyRoute } from '@tanstack/react-router';
import { TabbedModule } from '../../components/edit';
import type { ModuleTab } from '../../components/edit';

const TABS: ModuleTab[] = [
  { href: '/support/sponsors', label: 'Sponsors' },
  { href: '/support/tiers', label: 'Tiers' },
  { href: '/support/documents', label: 'Documents' },
  { href: '/support/budget', label: 'Budget' },
];

/** The season the Budget tab opens on (the current season; its id is a §11 slug). */
const BUDGET_DEFAULT = 'decode';

/** /support: a tab row (TabbedModule) over each tab's own screen. */
export function supportRoutes(parent: AnyRoute): AnyRoute[] {
  const support = createRoute({ getParentRoute: () => parent, path: '/support', component: () => <TabbedModule label="Support sections" tabs={TABS} /> });
  const sponsors = createRoute({ getParentRoute: () => support, path: 'sponsors', component: lazyRouteComponent(() => import('./SponsorsList'), 'SponsorsLayout') });
  const budget = createRoute({ getParentRoute: () => support, path: 'budget' });
  return [support.addChildren([
    createRoute({ getParentRoute: () => support, path: '/', beforeLoad: () => { throw redirect({ to: '/support/sponsors' }); } }),
    sponsors.addChildren([
      createRoute({ getParentRoute: () => sponsors, path: '/', component: lazyRouteComponent(() => import('./SponsorsList'), 'SponsorsIndex') }),
      createRoute({ getParentRoute: () => sponsors, path: 'new', component: lazyRouteComponent(() => import('./SponsorEditor'), 'SponsorNew') }),
      createRoute({ getParentRoute: () => sponsors, path: '$id', component: lazyRouteComponent(() => import('./SponsorEditor'), 'SponsorEdit') }),
    ]),
    createRoute({ getParentRoute: () => support, path: 'tiers', component: lazyRouteComponent(() => import('./TiersTab'), 'TiersTab') }),
    createRoute({ getParentRoute: () => support, path: 'documents', component: lazyRouteComponent(() => import('./DocumentsTab'), 'DocumentsTab') }),
    budget.addChildren([
      createRoute({ getParentRoute: () => budget, path: '/', beforeLoad: () => { throw redirect({ to: `/support/budget/${BUDGET_DEFAULT}` }); } }),
      createRoute({ getParentRoute: () => budget, path: '$season', component: lazyRouteComponent(() => import('./BudgetTab'), 'BudgetTab') }),
    ]),
  ])];
}
