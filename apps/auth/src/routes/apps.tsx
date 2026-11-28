import { useQuery } from '@tanstack/react-query';
import { Navigate, useNavigate } from '@tanstack/react-router';
import { auth } from '../lib/auth';
import { Heading } from '../components/form';
import { Arrow } from '../components/icons';

const CMS = import.meta.env.VITE_CMS_URL;

/** Apps a member may open, from their permissions. New team apps add an entry here with the permissions that unlock it. */
const APPS = [
  { name: 'Content manager', note: 'Website, linktree and team settings', href: CMS, allows: (p: string[]) => p.some((x) => x.startsWith('cms.') || x === 'admin') },
];

export function Apps() {
  const navigate = useNavigate();
  const me = useQuery({ queryKey: ['me'], queryFn: () => auth.session(), retry: false, staleTime: 0 });

  if (me.isPending) return <div className="step" aria-busy="true"><Heading title="Your apps">Loading…</Heading></div>;
  if (!me.data) return <Navigate to="/" />;

  const user = me.data;
  const apps = APPS.filter((a) => a.allows(user.permissions));
  async function out() {
    try { await auth.signOut(); } catch { /* the browser's session is gone either way */ }
    navigate({ to: '/' });
  }
  return (
    <div className="step">
      <Heading title="Your apps">Signed in as <strong>{user.email}</strong>.</Heading>
      <div className="form">
        {apps.length === 0 && <p className="fine">Your account has no apps yet. Ask a team admin for access.</p>}
        {apps.map((a) => (
          <a key={a.name} className="btn btn--primary" href={a.href}>{a.name}<Arrow /></a>
        ))}
        {apps.map((a) => <p key={a.name} className="fine">{a.note}</p>)}
        <button type="button" className="btn btn--ghost" onClick={out}>Sign out</button>
      </div>
    </div>
  );
}
