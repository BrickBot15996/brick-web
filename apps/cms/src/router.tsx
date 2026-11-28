import { useEffect } from 'react';
import type { AnyRoute } from '@tanstack/react-router';
import { createRootRoute, createRoute, createRouter, Outlet, useRouterState } from '@tanstack/react-router';
import { useSession } from './lib/data/hooks';
import { cms } from './lib/data';
import { can, hasCms, moduleForPath } from './lib/modules';
import { Shell } from './components/Shell';
import { Home } from './routes/home';
import { NoAccess, NotFound } from './routes/not-found';
import { Boot } from './routes/boot';
import { registry } from './modules';
import { kitRoutes } from './routes/kit-routes';
import { RouteLoading } from './routes/route-loading';

const AUTH_URL = import.meta.env.VITE_AUTH_URL;

/** Renders the page only when the member holds the permission its module asks for (typing a URL is not a way around the rail). */
function Guard({ permissions }: { permissions: readonly string[] }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const m = moduleForPath(pathname);
  if (m && !can(permissions, m.requires)) return <NoAccess />;
  return <Outlet />;
}

function Root() {
  const session = useSession();
  const none = session.isSuccess && !session.data;

  // No session: auth.brickbot.ro sends the member back here after sign-in (CLAUDE.md §2).
  useEffect(() => {
    if (none) location.replace(`${AUTH_URL}?redirect=${encodeURIComponent(location.href)}`);
  }, [none]);

  if (session.isError) {
    return (
      <Boot>
        <span>Couldn’t check your sign-in. </span>
        <button type="button" className="link" onClick={() => void session.refetch()}>Try again</button>
      </Boot>
    );
  }
  if (!session.data) return <Boot>{none ? 'Taking you to sign in…' : 'Loading…'}</Boot>;
  if (!hasCms(session.data.permissions) && !session.data.permissions.includes('admin')) {
    return (
      <Boot>
        <span>Your account has no access yet. Ask a team admin. </span>
        <button type="button" className="link" onClick={() => void cms.signOut()}>Sign out</button>
      </Boot>
    );
  }
  return <Shell session={session.data}><Guard permissions={session.data.permissions} /></Shell>;
}

const root = createRootRoute({ component: Root, notFoundComponent: NotFound });

const home = createRoute({ getParentRoute: () => root, path: '/', component: Home });

// Every other route comes from the module registry: each module declares its own routes (src/modules/<id>/).
const moduleRoutes = registry.flatMap((m) => m.routes(root));
// The component kit's reference page, in development only.
const dev: AnyRoute[] = import.meta.env.DEV ? kitRoutes(root) : [];

export const router = createRouter({ routeTree: root.addChildren([home, ...moduleRoutes, ...dev]), defaultPreload: 'intent', scrollRestoration: false, defaultPendingComponent: RouteLoading, defaultPendingMs: 120, defaultPendingMinMs: 300 });

declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}
