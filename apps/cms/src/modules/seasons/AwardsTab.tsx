import { useMemo, useState } from 'react';
import { useRouter, useRouterState } from '@tanstack/react-router';
import { useAwards, useRemoveAward, useSaveAward, useSeasonEvents, useSeasonRecords } from './data/hooks';
import { AWARD_TYPES } from './data/types';
import type { Award, SeasonRecord } from './data/types';
import { missingIn } from '../../lib/form';
import type { Errors } from '../../lib/form';
import { useEditForm } from '../../lib/form';
import { BilingualField, DataTable, SelectField } from '../../components/edit';
import type { Column } from '../../components/edit';
import { Icon } from '../../components/icons';
import { PageHeader } from '../../components/PageHeader';
import { ConfirmDialog, FormDialog } from './ui';
import { Tag } from '../../components/Tag';

const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

export function AwardsPage() {
  const seasons = useSeasonRecords();
  const awards = useAwards();
  const router = useRouter();
  const search = useRouterState({ select: (s) => s.location.search }) as { award?: string };
  const [season, setSeason] = useState('all');
  const [type, setType] = useState('all');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<{ award: Award | null } | null>(null);
  const [del, setDel] = useState<Award | null>(null);

  const list = seasons.data ?? [];
  const byId = useMemo(() => new Map(list.map((s) => [s.id, s])), [list]);
  const all = awards.data ?? [];
  // An award opened from the palette (?award=id) opens its editor once the data is here.
  const fromUrl = search.award && awards.data ? awards.data.find((a) => a.id === String(search.award)) : undefined;
  const open = editing ?? (fromUrl ? { award: fromUrl } : null);
  const close = () => { setEditing(null); if (search.award) router.history.replace('/seasons/awards'); };

  const shown = useMemo(() => {
    const n = norm(query.trim());
    return all.filter((a) => (season === 'all' || a.season === season) && (type === 'all' || (type === 'none' ? !a.type : a.type === type))
      && (!n || norm(`${a.name.en} ${a.name.ro} ${a.event.en} ${a.event.ro}`).includes(n)));
  }, [all, season, type, query]);
  const filtered = season !== 'all' || type !== 'all' || query.trim() !== '';
  const label = (id: string) => { const s = byId.get(id); return s ? `${s.game} ${s.years}` : id; };

  const cols: Column<Award>[] = [
    { id: 'season', header: 'Season', width: '11rem', sort: (a, b) => (byId.get(a.season)?.years ?? '').localeCompare(byId.get(b.season)?.years ?? ''), cell: (a) => <span className="sea-ev__name">{label(a.season)}</span> },
    {
      id: 'award', header: 'Award', sort: (a, b) => a.name.en.localeCompare(b.name.en), cell: (a) => (
        <span className="sea-ev">
          <span className="sea-ev__name">{a.name.en}</span>
          {missingIn(a.name) === 'ro' && <span className="sea-ev__tags"><Tag>Romanian missing</Tag></span>}
        </span>
      ),
    },
    { id: 'event', header: 'Won at', sort: (a, b) => a.event.en.localeCompare(b.event.en), cell: (a) => <span>{a.event.en}</span> },
    { id: 'type', header: 'Type', secondary: true, sort: (a, b) => (a.type ?? '').localeCompare(b.type ?? ''), cell: (a) => (a.type ? <span>{a.type}</span> : <span className="sea-none">None</span>) },
  ];

  return (
    <div className="col col--tab sea-awards">
      <section className="tp" aria-label="Awards">
        <PageHeader
          sub={awards.isPending ? undefined : <span className="tnum" role="status">{`${shown.length} ${shown.length === 1 ? 'award' : 'awards'}${filtered ? ` of ${all.length}` : ''}`}</span>}
          actions={<button type="button" className="btn btn--primary btn--sm" disabled={!seasons.data} onClick={() => setEditing({ award: null })}><Icon name="plus" />Add award</button>} />
        <div className="tp__tools">
          <div className="lp__search">
            <Icon name="search" />
            <input type="search" className="input input--search" aria-label="Search awards" placeholder="Search awards" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <label className="lp__filter"><span className="label">Season</span>
            <select className="input input--select input--sm" value={season} onChange={(e) => setSeason(e.target.value)}>
              <option value="all">All seasons</option>
              {list.map((s) => <option key={s.id} value={s.id}>{s.game} {s.years}</option>)}
            </select>
          </label>
          <label className="lp__filter"><span className="label">Type</span>
            <select className="input input--select input--sm" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="all">All types</option>
              {AWARD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              <option value="none">No type</option>
            </select>
          </label>
        </div>
        <DataTable<Award>
          label="Awards of every season"
          rows={shown}
          columns={cols}
          rowKey={(a) => a.id}
          actionsLabel="Edit or delete"
          actions={(a) => (
            <>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setEditing({ award: a })}>Edit<span className="sr-only"> {a.name.en}</span></button>
              <button type="button" className="iconbtn iconbtn--sm" aria-label={`Delete ${a.name.en}`} onClick={() => setDel(a)}><Icon name="trash" /></button>
            </>
          )}
          loading={awards.isPending}
          error={awards.isError}
          onRetry={() => void awards.refetch()}
          filtered={filtered}
          noResults="No award matches these filters."
          defaultSort={{ id: 'season', dir: 'desc' }}
          empty={{ title: 'No awards yet.', body: 'Add the first award and it shows on the Team page and its season.' }}
        />
      </section>
      {open && <AwardDialog award={open.award} seasons={list} defaultSeason={season !== 'all' ? season : list.find((s) => s.current)?.id ?? list[0]?.id ?? ''} onClose={close} />}
      {del && <DeleteAward award={del} season={label(del.season)} onClose={() => setDel(null)} />}
    </div>
  );
}

// ───────── editor dialog ─────────

interface AwardForm { season: string; ref: string; event: { en: string; ro: string }; name: { en: string; ro: string }; type: string }
const TEXT = 'text';

function AwardDialog({ award, seasons, defaultSeason, onClose }: { award: Award | null; seasons: SeasonRecord[]; defaultSeason: string; onClose: () => void }) {
  const save = useSaveAward();
  const form = useEditForm<AwardForm>({
    initial: award
      ? { season: award.season, ref: award.eventCode ? `i:${award.eventCode}` : award.extraId ? `x:${award.extraId}` : TEXT, event: { ...award.event }, name: { ...award.name }, type: award.type ?? '' }
      : { season: defaultSeason, ref: TEXT, event: { en: '', ro: '' }, name: { en: '', ro: '' }, type: '' },
    validate: (v) => {
      const e: Errors = {};
      if (!v.season) e.season = 'Choose the season.';
      if (!v.name.en.trim()) e['name.en'] = 'Name the award.';
      if (!v.event.en.trim()) e['event.en'] = 'Say where it was won.';
      return e;
    },
    derive: (next, changed) => {
      if (changed === 'season') return { ...next, ref: TEXT };
      if (changed === 'ref' && next.ref !== TEXT) {
        const ev = options.find((o) => o.value === next.ref);
        if (ev?.names) return { ...next, event: { ...ev.names } };
      }
      return next;
    },
    save: (v) => save.mutateAsync({
      id: award?.id ?? null,
      input: {
        season: v.season, name: { en: v.name.en.trim(), ro: v.name.ro.trim() }, event: { en: v.event.en.trim(), ro: v.event.ro.trim() },
        eventCode: v.ref.startsWith('i:') ? v.ref.slice(2) : null, extraId: v.ref.startsWith('x:') ? v.ref.slice(2) : null, type: v.type || null,
      },
    }),
    onSaved: onClose,
  });

  const chosen = seasons.find((s) => s.id === form.values.season);
  const hasEvents = chosen ? Number(chosen.years.slice(0, 4)) >= 2020 : false;
  const events = useSeasonEvents(form.values.season, hasEvents && !!form.values.season);
  const options = useMemo(() => [
    { value: TEXT, label: 'Another event (type its name)', names: null as { en: string; ro: string } | null },
    ...(events.data?.imported ?? []).map((e) => ({ value: `i:${e.code}`, label: `${e.name} (FTC Events)`, names: { en: e.name, ro: e.name } })),
    ...(events.data?.extras ?? []).map((e) => ({ value: `x:${e.id}`, label: `${e.name.en} (added by hand)`, names: { ...e.name } })),
  ], [events.data]);

  return (
    <FormDialog title={award ? `Edit ${award.name.en}` : 'Add an award'} form={form} onClose={onClose} submit={award ? 'Save award' : 'Add award'}>
      <SelectField name="season" label="Season" options={seasons.map((s) => ({ value: s.id, label: `${s.game} ${s.years}` }))} />
      <BilingualField name="name" label="Award" placeholder="Think Award, 2nd place" />
      <SelectField name="ref" label="Won at" options={options}
        hint={!hasEvents ? 'This season has no events table, so the event is typed in.' : events.isPending ? 'Loading this season’s events…' : 'Link it to one of the season’s events, or type another one.'} />
      <BilingualField name="event" label="Event name" hint="As the website prints it. Linking an event fills this in." />
      <SelectField name="type" label="Type" optional placeholder="No type" options={AWARD_TYPES.map((t) => ({ value: t, label: t }))} />
    </FormDialog>
  );
}

function DeleteAward({ award, season, onClose }: { award: Award; season: string; onClose: () => void }) {
  const rm = useRemoveAward();
  const [err, setErr] = useState<string | null>(null);
  return (
    <ConfirmDialog title={`Delete ${award.name.en}?`} confirm="Delete award" danger busy={rm.isPending} error={err} onCancel={onClose}
      body={<p>This removes the award from {season} and from the Team page on the next Publish. It can’t be undone.</p>}
      onConfirm={() => rm.mutate(award.id, { onSuccess: onClose, onError: (e) => setErr(e instanceof Error ? e.message : 'Try again.') })} />
  );
}
