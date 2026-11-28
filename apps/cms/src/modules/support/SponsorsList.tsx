import { useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useRouterState } from '@tanstack/react-router';
import { useSponsors, useTiers } from './data/hooks';
import { useSeasons } from '../../lib/data/hooks';
import { AppLink } from '../../components/AppLink';
import { Icon } from '../../components/icons';
import { EditorEmpty, ListPane, ListRow, MasterDetail, Thumb } from '../../components/edit';
import type { ListState } from '../../components/edit';

const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
export const SPONSORS_BASE = '/support/sponsors';
const BASE = SPONSORS_BASE;

export function SponsorsLayout() {
  const q = useSponsors();
  const seasons = useSeasons().data ?? [];
  const tiers = useTiers().data ?? [];
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const selected = pathname.startsWith(`${BASE}/`) && !pathname.endsWith('/new') ? decodeURIComponent(pathname.slice(BASE.length + 1).replace(/\/$/, '')) : null;
  const [query, setQuery] = useState('');
  const [tier, setTier] = useState('all');
  const [pickedSeason, setPickedSeason] = useState<string | null>(null);
  const current = seasons.find((s) => s.current)?.id;
  const season = pickedSeason ?? current ?? 'all';
  const all = q.data ?? [];

  // Opening a sponsor from the palette or home that is outside the filter widens the filter to its season.
  const seen = useRef<string | null>(null);
  useEffect(() => {
    if (!selected || seen.current === selected || !q.data) return;
    seen.current = selected;
    const s = q.data.find((x) => x.id === selected);
    if (s && season !== 'all' && s.season !== season) setPickedSeason(s.season);
    if (s && tier !== 'all' && s.tier !== tier) setTier('all');
  }, [selected, q.data, season, tier]);

  const shown = useMemo(() => {
    const n = norm(query.trim());
    return all
      .filter((s) => (season === 'all' || s.season === season) && (tier === 'all' || s.tier === tier) && (!n || norm(s.name).includes(n)))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [all, query, season, tier]);
  const state: ListState = q.isPending ? 'loading' : q.isError ? 'error' : all.length === 0 ? 'empty' : shown.length === 0 ? 'noresults' : 'ready';
  const years = (id: string) => seasons.find((s) => s.id === id)?.years ?? '';
  const tierName = (id: string) => tiers.find((t) => t.id === id)?.name ?? id;
  // The current season usually starts with no sponsors: offer the latest season that has some.
  const latest = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of all) counts.set(s.season, (counts.get(s.season) ?? 0) + 1);
    const hit = seasons.find((s) => (counts.get(s.id) ?? 0) > 0);
    return hit ? { id: hit.id, label: `${hit.game} ${hit.years}`, n: counts.get(hit.id) ?? 0 } : null;
  }, [all, seasons]);
  const seasonLabel = (id: string) => { const s = seasons.find((x) => x.id === id); return s ? `${s.game} ${s.years}` : id; };
  const seasonEmpty = season !== 'all' && tier === 'all' && query.trim() === '' && !all.some((s) => s.season === season);
  const filtered = season !== 'all' || tier !== 'all' || query.trim() !== '';

  return (
    <MasterDetail base={BASE} list={
      <ListPane
        title="Sponsors"
        count={`${shown.length} ${shown.length === 1 ? 'sponsor' : 'sponsors'}`}
        search={{ value: query, onChange: setQuery, label: 'Search sponsors' }}
        action={<AppLink href={`${BASE}/new`} className="btn btn--primary btn--sm"><Icon name="plus" />New</AppLink>}
        filters={
          <>
            <label className="lp__filter"><span className="label">Season</span>
              <select className="input input--select input--sm" value={season} onChange={(e) => setPickedSeason(e.target.value)}>
                <option value="all">All seasons</option>
                {seasons.map((s) => <option key={s.id} value={s.id}>{s.game} {s.years}</option>)}
              </select>
            </label>
            <label className="lp__filter"><span className="label">Tier</span>
              <select className="input input--select input--sm" value={tier} onChange={(e) => setTier(e.target.value)}>
                <option value="all">All tiers</option>
                {tiers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </label>
          </>
        }
        state={state}
        empty={{ title: 'No sponsors yet.', body: 'Add one and its logo joins the Our Sponsors page.' }}
        noResults={seasonEmpty ? (
          <>
            <p className="lp__empty-t">No sponsors for <span style={{ whiteSpace: 'nowrap' }}>{seasonLabel(season)}</span> yet.</p>
            <p>Add the first one, or look at an earlier season.</p>
            {latest && latest.id !== season && <button type="button" className="btn btn--ghost btn--sm" onClick={() => setPickedSeason(latest.id)}>Show {latest.label} · {latest.n}</button>}
            <AppLink href={`${BASE}/new`} className="btn btn--ghost btn--sm"><Icon name="plus" />New sponsor</AppLink>
          </>
        ) : filtered ? 'No sponsor matches. Try another season or tier, or clear the search.' : 'No sponsors.'}
        onRetry={() => void q.refetch()}
      >
        {shown.map((s) => (
          <ListRow key={s.id} href={`${BASE}/${s.id}`} selected={selected === s.id} thumb={<Thumb src={s.logo} />} name={s.name} meta={`${tierName(s.tier)} · ${years(s.season)}`} />
        ))}
      </ListPane>
    }>
      <Outlet />
    </MasterDetail>
  );
}

export function SponsorsIndex() {
  return <EditorEmpty text="Pick a sponsor to edit it, or add a new one." action={<AppLink href={`${BASE}/new`} className="btn btn--primary"><Icon name="plus" />New sponsor</AppLink>} />;
}
