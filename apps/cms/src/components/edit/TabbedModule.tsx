import { Outlet, useRouterState } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { AppLink } from '../AppLink';

export interface ModuleTab { href: string; label: string }

/**
 * A module split into sub-sections that are routes (Support: Sponsors / Tiers / Documents / Budget). It draws the tab
 * row and an Outlet for the active tab's screen, and highlights the tab whose path the URL is under. Use it as the
 * component of the module's layout route; each tab is a child route of that layout (a list → edit tab brings its own
 * MasterDetail, a table tab brings TablePage). `label` names the tab row for screen readers.
 *
 *   createRoute({ getParentRoute: () => parent, path: '/support', component: () => <TabbedModule label="Support sections" tabs={TABS} /> })
 */
export function TabbedModule({ label, tabs }: { label: string; tabs: ModuleTab[] }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="tabm">
      <nav className="tabs" aria-label={label}>
        {tabs.map((t) => (
          <AppLink key={t.href} href={t.href} className="tabs__tab" aria-current={pathname === t.href || pathname.startsWith(t.href + '/') ? 'page' : undefined}>{t.label}</AppLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}

/** A tab that is not built yet: its name, what it will hold, and a way back to a tab that works. */
export function TabLater({ name, blurb, ready }: { name: string; blurb: string; ready: ModuleTab }) {
  return (
    <div className="col col--tab">
      <h2 className="lp__title">{name}</h2>
      <div className="holder">
        <p className="holder__lead">{blurb}</p>
        <p>{`This tab arrives in a later round. ${ready.label} is ready to use.`}</p>
        <AppLink href={ready.href} className="link holder__back">{`Go to ${ready.label}`}</AppLink>
      </div>
    </div>
  );
}

/** The single-column page of a tab that is not a list → edit (a table, a form): the same side padding as the tab row. */
export function TabPage({ children }: { children: ReactNode }) {
  return <div className="col col--tab">{children}</div>;
}
