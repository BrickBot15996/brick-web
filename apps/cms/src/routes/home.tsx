import { useEffect, useRef, useState } from 'react';
import { useActivity } from '../lib/data/hooks';
import type { ActivityItem } from '../lib/data';
import { chipModules, modulesFor } from '../lib/modules';
import { dayGroup, initials, relativeTime } from '../lib/format';
import type { DayGroup } from '../lib/format';
import { useMedia } from '../lib/media';
import { useShell } from '../lib/shell';
import { AppLink } from '../components/AppLink';
import { Icon } from '../components/icons';
import { JumpCombobox } from '../components/JumpCombobox';

export function Home() {
  const { session, openPalette, setPublishOpen } = useShell();
  const fine = useMedia('(hover: hover) and (pointer: fine)');
  const chips = chipModules(session.permissions);
  const total = modulesFor(session.permissions).filter((m) => m.id !== 'home').length;

  return (
    <div className="col">
      <h1 className="h1">Where to?</h1>
      <JumpCombobox session={session} variant="inline" autoFocus={fine} onPublish={() => setPublishOpen(true)} />
      <nav className="chips" aria-label="Modules">
        {chips.map((m) => (
          <AppLink key={m.id} href={m.path} className="chip"><Icon name={m.icon} />{m.label}</AppLink>
        ))}
        {total > chips.length && <button type="button" className="chip chip--more" onClick={openPalette}>All {total} modules</button>}
      </nav>
      <Lately />
    </div>
  );
}

type Scope = 'everyone' | 'me';

function Lately() {
  const { session } = useShell();
  const q = useActivity();
  const [scope, setScope] = useState<Scope>('everyone');
  const heading = useRef<HTMLHeadingElement>(null);

  const items = (q.data ?? []).filter((a) => scope === 'everyone' || a.actorEmail === session.email);
  const groups = (['Today', 'Yesterday', 'Earlier'] as DayGroup[])
    .map((g) => ({ g, items: items.filter((a) => dayGroup(a.at) === g) }))
    .filter((x) => x.items.length);

  return (
    <section className="lately" aria-labelledby="lately-h">
      <div className="lately__head">
        <h2 id="lately-h" className="h2" ref={heading}>Lately on the team</h2>
        <div className="seg" role="radiogroup" aria-label="Whose changes">
          {([['everyone', 'Everyone'], ['me', 'Just me']] as const).map(([v, label]) => (
            <label key={v} className="seg__opt">
              <input type="radio" name="scope" value={v} className="sr-only" checked={scope === v} onChange={() => setScope(v)} />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>

      {q.isPending && <Skeleton />}
      {q.isError && (
        <div className="notice" role="alert">
          <span>Couldn’t load the latest changes.</span>
          <button type="button" className="link" onClick={() => void q.refetch()}>Try again</button>
        </div>
      )}
      {q.isSuccess && groups.length === 0 && (
        <p className="empty">
          {scope === 'me'
            ? 'You haven’t changed anything lately. Open a module above, make an edit, and it will show up here.'
            : 'Nothing has changed lately. When someone edits something, it shows up here.'}
        </p>
      )}
      {groups.map(({ g, items }) => (
        <div key={g} role="group" aria-label={g}>
          <h3 className="day label">{g}</h3>
          <ul className="rows">
            {items.map((a) => <li key={a.id}><Row a={a} me={session.email} /></li>)}
          </ul>
        </div>
      ))}
    </section>
  );
}

function Row({ a, me }: { a: ActivityItem; me: string }) {
  const mine = a.actorEmail === me;
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick((n) => n + 1), 60_000); return () => clearInterval(t); }, []);
  return (
    <AppLink href={a.href} className="row">
      <span className="tile" aria-hidden="true">{initials(a.actorEmail)}</span>
      <span className="row__text">
        <b className="row__who">{mine ? 'You' : a.actorEmail}</b>
        <span className="row__what"> {a.action} <b>{a.targetLabel}</b>{a.detail ? ` ${a.detail}` : ''}</span>
      </span>
      <span className="tag">{a.module}</span>
      <time className="tm tnum" dateTime={a.at}>{relativeTime(a.at)}</time>
      <Icon name="arrow" className="i row__arrow" />
    </AppLink>
  );
}

function Skeleton() {
  return (
    <div aria-hidden="true" className="rows">
      {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ opacity: 1 - i * 0.18 }} />)}
    </div>
  );
}
