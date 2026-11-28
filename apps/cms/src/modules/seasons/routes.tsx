import { createRoute, lazyRouteComponent } from '@tanstack/react-router';
import type { AnyRoute } from '@tanstack/react-router';
import { Outlet, useRouterState } from '@tanstack/react-router';
import { AppLink } from '../../components/AppLink';

const TABS = [{ href: '/seasons', label: 'Seasons' }, { href: '/seasons/awards', label: 'Awards' }];

/** The tab row. Seasons lives at /seasons and /seasons/{id}, Awards at /seasons/awards, so "active" cannot be a plain prefix match. */
function SeasonsShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname }).replace(/\/$/, '');
  const awards = pathname === '/seasons/awards';
  return (
    <div className="tabm">
      <nav className="tabs" aria-label="Seasons sections">
        {TABS.map((t) => (
          <AppLink key={t.href} href={t.href} className="tabs__tab" aria-current={(t.href === '/seasons/awards') === awards ? 'page' : undefined}>{t.label}</AppLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}

/** /seasons: tabs over (a) the season list → editor and (b) the awards table. */
export function seasonRoutes(parent: AnyRoute): AnyRoute[] {
  const shell = createRoute({ getParentRoute: () => parent, path: '/seasons', component: SeasonsShell });
  const md = createRoute({ getParentRoute: () => shell, id: 'seasons-md', component: lazyRouteComponent(() => import('./SeasonsList'), 'SeasonsLayout') });
  return [shell.addChildren([
    md.addChildren([
      createRoute({ getParentRoute: () => md, path: '/', component: lazyRouteComponent(() => import('./SeasonsList'), 'SeasonsIndex') }),
      createRoute({ getParentRoute: () => md, path: '$id', component: lazyRouteComponent(() => import('./SeasonEditor'), 'SeasonEdit') }),
    ]),
    createRoute({ getParentRoute: () => shell, path: 'awards', component: lazyRouteComponent(() => import('./AwardsTab'), 'AwardsPage') }),
  ])];
}
