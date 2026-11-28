import { createRootRoute, createRoute, createRouter, Outlet } from '@tanstack/react-router';
import { Shell } from './components/Shell';
import { SignIn } from './routes/sign-in';
import { Code } from './routes/code';
import { Forgot } from './routes/forgot';
import { SetPassword } from './routes/set-password';
import { Done } from './routes/done';
import { Apps } from './routes/apps';

const str = (v: unknown) => (typeof v === 'string' && v ? v : undefined);

const root = createRootRoute({
  component: () => <Shell><Outlet /></Shell>,
  notFoundComponent: SignIn,
});
const routes = [
  createRoute({ getParentRoute: () => root, path: '/', component: SignIn, validateSearch: (s: Record<string, unknown>): { redirect?: string } => ({ redirect: str(s.redirect) }) }),
  createRoute({ getParentRoute: () => root, path: '/code', component: Code }),
  createRoute({ getParentRoute: () => root, path: '/forgot', component: Forgot, validateSearch: (s: Record<string, unknown>): { email?: string } => ({ email: str(s.email) }) }),
  createRoute({ getParentRoute: () => root, path: '/reset', component: () => <SetPassword kind="reset" />, validateSearch: (s: Record<string, unknown>): { token?: string } => ({ token: str(s.token) }) }),
  createRoute({ getParentRoute: () => root, path: '/invite', component: () => <SetPassword kind="invite" />, validateSearch: (s: Record<string, unknown>): { token?: string } => ({ token: str(s.token) }) }),
  createRoute({ getParentRoute: () => root, path: '/done', component: Done }),
  createRoute({ getParentRoute: () => root, path: '/apps', component: Apps }),
];

export const router = createRouter({ routeTree: root.addChildren(routes), defaultPreload: 'intent' });

declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}
