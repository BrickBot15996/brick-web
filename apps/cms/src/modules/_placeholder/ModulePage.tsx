import { can, moduleById } from '../../lib/modules';
import { useShell } from '../../lib/shell';
import { AppLink } from '../../components/AppLink';
import { Icon } from '../../components/icons';
import { NotFound } from '../../routes/not-found';

/** Stand-in for a module whose screens are not built yet. Replace per module as the screens arrive. */
export function ModulePage({ id }: { id: string }) {
  const { session } = useShell();
  const m = moduleById(id);
  if (!m) return <NotFound />;
  const allowed = can(session.permissions, m.requires);
  return (
    <div className="col">
      <h1 className="h1">{m.label}</h1>
      <div className="holder">
        {allowed ? (
          <>
            <p className="holder__lead">{m.blurb}</p>
            <p>This module arrives in a later build round.</p>
          </>
        ) : (
          <>
            <p className="holder__lead">You don’t have access to {m.label}.</p>
            <p>Ask a team admin if you need it.</p>
          </>
        )}
        <AppLink href="/" className="link holder__back"><Icon name="arrow" className="i holder__arr" />Back to Home</AppLink>
      </div>
    </div>
  );
}
