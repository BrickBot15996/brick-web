import { createRoute, redirect, lazyRouteComponent } from '@tanstack/react-router';
import type { AnyRoute } from '@tanstack/react-router';
import { TabbedModule } from '../../components/edit';
import type { ModuleTab } from '../../components/edit';

const TABS: ModuleTab[] = [
  { href: '/home-faq/hero', label: 'Hero' },
  { href: '/home-faq/faq', label: 'FAQ' },
  { href: '/home-faq/form-230', label: 'Form 230' },
];

/** /home-faq: tab row over Hero (single record), FAQ (list → edit with reorder) and Form 230 (single record). */
export function homeFaqRoutes(parent: AnyRoute): AnyRoute[] {
  const root = createRoute({ getParentRoute: () => parent, path: '/home-faq', component: () => <TabbedModule label="Home & FAQ sections" tabs={TABS} /> });
  const faq = createRoute({ getParentRoute: () => root, path: 'faq', component: lazyRouteComponent(() => import('./Faq'), 'FaqLayout') });
  return [root.addChildren([
    createRoute({ getParentRoute: () => root, path: '/', beforeLoad: () => { throw redirect({ to: '/home-faq/hero' }); } }),
    createRoute({ getParentRoute: () => root, path: 'hero', component: lazyRouteComponent(() => import('./HeroTab'), 'HeroTab') }),
    faq.addChildren([
      createRoute({ getParentRoute: () => faq, path: '/', component: lazyRouteComponent(() => import('./Faq'), 'FaqIndex') }),
      createRoute({ getParentRoute: () => faq, path: 'new', component: lazyRouteComponent(() => import('./Faq'), 'FaqNew') }),
      createRoute({ getParentRoute: () => faq, path: '$id', component: lazyRouteComponent(() => import('./Faq'), 'FaqEdit') }),
    ]),
    createRoute({ getParentRoute: () => root, path: 'form-230', component: lazyRouteComponent(() => import('./Form230Tab'), 'Form230Tab') }),
  ])];
}
