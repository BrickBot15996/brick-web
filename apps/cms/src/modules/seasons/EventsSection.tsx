import { useMemo, useState } from 'react';
import { useAwards, useClearOverride, useRemoveExtra, useSaveExtra, useSeasonEvents, useSetOverride } from './data/hooks';
import type { ExtraEvent, SeasonRecord } from './data/types';
import { buildRows, HIDDEN_WHY, importedResult, isValidEventDate, nextEvent, showDate } from './events';
import type { EventRow } from './events';
import { PREVIEW } from '../../lib/data';
import { isUrl } from '../../lib/format';
import type { Errors } from '../../lib/form';
import { useEditForm } from '../../lib/form';
import { BilingualField, Callout, DataTable, NumberField, Section, TextField } from '../../components/edit';
import type { Column } from '../../components/edit';
import { Icon } from '../../components/icons';
import { ConfirmDialog, FormDialog } from './ui';
import { Tag } from '../../components/Tag';

const FTC_EVENTS = 'https://ftc-events.firstinspires.org';
const startYear = (years: string) => Number(years.slice(0, 4));

/** The events table of one season, the next event (current season) and the dialogs that edit them. */
export function EventsSection({ season }: { season: SeasonRecord }) {
  const noEvents = startYear(season.years) < 2020;
  const events = useSeasonEvents(season.id, !noEvents);
  const awards = useAwards();
  const [override, setOverride] = useState<EventRow | null>(null);
  const [extra, setExtra] = useState<{ row: ExtraEvent | null } | null>(null);
  const [del, setDel] = useState<ExtraEvent | null>(null);

  const rows = useMemo(() => (events.data ? buildRows(events.data, (awards.data ?? []).filter((a) => a.season === season.id)) : []), [events.data, awards.data, season.id]);
  const next = season.current ? nextEvent(rows) : null;

  if (noEvents) {
    return (
      <Section title="Events">
        <Callout>Seasons before 2020 have no events table: FTC Events holds no data for them, so the website shows only the awards. Add them in the Awards tab.</Callout>
      </Section>
    );
  }

  const cols: Column<EventRow>[] = [
    { id: 'date', header: 'Date', sort: (a, b) => a.sortKey.localeCompare(b.sortKey), width: '8.5rem', cell: (r) => <span className={`tnum ${r.hidden ? 'sea-dim' : ''}`}>{showDate(r.date)}</span> },
    {
      id: 'event', header: 'Event', sort: (a, b) => a.name.localeCompare(b.name), cell: (r) => (
        <span className={`sea-ev ${r.hidden ? 'sea-dim' : ''}`}>
          <span className="sea-ev__name">{r.name}</span>
          <span className="sea-ev__sub">
            {r.placeUrl ? <a className="link" href={r.placeUrl} target="_blank" rel="noreferrer">{r.place}<span className="sr-only"> (opens in a new tab)</span></a> : r.place}
          </span>
          <span className="sea-ev__tags">
            {r.kind === 'extra' ? <Tag>Added by hand</Tag> : <Tag>FTC Events{PREVIEW ? ' · sample' : ''}</Tag>}
            {r.override && <Tag lit>Custom result</Tag>}
            {r.upcoming && <Tag lit>Upcoming</Tag>}
            {r.awards > 0 && <Tag>{r.awards} {r.awards === 1 ? 'award' : 'awards'}</Tag>}
            {r.hidden && <Tag>Hidden</Tag>}
          </span>
          {r.hidden && <span className="sea-ev__why">{HIDDEN_WHY}</span>}
        </span>
      ),
    },
    {
      id: 'result', header: 'Result', cell: (r) => (
        <span className={`sea-res ${r.hidden ? 'sea-dim' : ''}`}>
          <span>{r.result || <span className="sea-none">{r.upcoming ? 'Not played yet' : 'No result'}</span>}</span>
          {r.original && <span className="sea-res__was">FTC Events says: {r.original}</span>}
          {r.extra && r.extra.result.en && !r.extra.result.ro && <span className="sea-res__was">Romanian missing</span>}
        </span>
      ),
    },
  ];

  const actions = (r: EventRow) => (
    <>
      {r.imported && (
        <>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setOverride(r)}>{r.override ? 'Edit result' : 'Custom result'}</button>
          <a className="iconbtn iconbtn--sm" href={r.imported.url} target="_blank" rel="noreferrer" aria-label={`${r.name} on FTC Events (opens in a new tab)`}><Icon name="external" /></a>
        </>
      )}
      {r.extra && (
        <>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setExtra({ row: r.extra! })}>Edit<span className="sr-only"> {r.name}</span></button>
          <button type="button" className="iconbtn iconbtn--sm" aria-label={`Delete ${r.name}`} onClick={() => setDel(r.extra!)}><Icon name="trash" /></button>
        </>
      )}
    </>
  );

  return (
    <>
      {season.current && (
        <Section title="Next event" note="The next event still ahead, from FTC Events or added by hand. The website shows it on the current season.">
          {events.isPending ? <div className="skeleton" style={{ height: 68 }} aria-hidden="true" />
            : next ? (
              <div className="sea-next">
                <span className="sea-next__name">{next.name}</span>
                <span className="sea-next__meta tnum">{showDate(next.date)}{next.place ? ` · ${next.place}` : ''}</span>
                <span className="sea-next__src">{next.kind === 'extra' ? 'Added by hand' : `From FTC Events${PREVIEW ? ' (sample)' : ''}`}</span>
              </div>
            )
              : <Callout>No upcoming event on record. It appears here as soon as FTC Events lists one, or add it below as an extra event.</Callout>}
        </Section>
      )}

      <Section title="Events" note={<>Official events come from <a className="link" href={FTC_EVENTS} target="_blank" rel="noreferrer">FTC Events<span className="sr-only"> (opens in a new tab)</span></a> at every build and can’t be edited; set a custom result when the imported one is not the whole story. Event data: FTC Events.</>}>
        <div className="sea-evtools">
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setExtra({ row: null })}><Icon name="plus" />Add extra event</button>
        </div>
        <DataTable<EventRow>
          label={`Events of ${season.game}`}
          rows={rows}
          columns={cols}
          rowKey={(r) => r.key}
          stack
          actions={actions}
          loading={events.isPending}
          error={events.isError}
          onRetry={() => void events.refetch()}
          defaultSort={{ id: 'date', dir: 'asc' }}
          empty={{ title: 'No events yet.', body: 'FTC Events lists the team’s events once the season starts. Offseason cups and other unofficial events are added as extra events.' }}
        />
      </Section>

      {override?.imported && <OverrideDialog season={season.id} row={override} onClose={() => setOverride(null)} />}
      {extra && <ExtraDialog season={season} row={extra.row} onClose={() => setExtra(null)} />}
      {del && <DeleteExtra row={del} onClose={() => setDel(null)} />}
    </>
  );
}

// ───────── custom result ─────────

interface OverrideForm { rank: number | null; result: { en: string; ro: string }; note: string }

function OverrideDialog({ season, row, onClose }: { season: string; row: EventRow; onClose: () => void }) {
  const ev = row.imported!;
  const set = useSetOverride();
  const clear = useClearOverride();
  const o = row.override;
  const form = useEditForm<OverrideForm>({
    initial: { rank: o?.rank ?? null, result: o ? { ...o.result } : { en: '', ro: '' }, note: o?.note ?? '' },
    validate: (v) => {
      const e: Errors = {};
      if (v.rank === null && !v.result.en.trim()) e.rank = 'Set a rank, a result text, or both.';
      else if (v.rank !== null && (!Number.isInteger(v.rank) || v.rank < 1)) e.rank = 'Use a whole number from 1.';
      return e;
    },
    save: (v) => set.mutateAsync({ season, code: ev.code, input: { rank: v.rank, result: { en: v.result.en.trim(), ro: v.result.ro.trim() }, note: v.note.trim() } }),
    onSaved: onClose,
  });
  const orig = importedResult(ev);
  return (
    <FormDialog title={`Custom result for ${ev.name}`} form={form} onClose={onClose} submit="Save result"
      extra={o && (
        <button type="button" className="btn btn--ghost sea-left" disabled={clear.isPending} onClick={() => clear.mutate({ season, code: ev.code }, { onSuccess: onClose })}>Use the FTC Events result</button>
      )}>
      <p className="sea-orig">FTC Events says: <b>{orig || 'no ranking'}</b>. A custom result replaces it on the website; the imported data stays untouched.</p>
      <NumberField name="rank" label="Rank" optional integer min={1} placeholder="2" hint="For a league meet, FTC Events only has the league’s running standing. Enter the meet’s own rank here." />
      <BilingualField name="result" label="Result text" optional placeholder="Semifinalist" hint="Winner, Finalist, Semifinalist… shown beside the rank." />
      <TextField name="note" label="Note" optional multiline hint="For the team only: where the number comes from." />
    </FormDialog>
  );
}

// ───────── extra events ─────────

interface ExtraForm { name: { en: string; ro: string }; date: string; place: { en: string; ro: string }; placeUrl: string; result: { en: string; ro: string } }

function ExtraDialog({ season, row, onClose }: { season: SeasonRecord; row: ExtraEvent | null; onClose: () => void }) {
  const save = useSaveExtra();
  const form = useEditForm<ExtraForm>({
    initial: row ? { name: { ...row.name }, date: row.date, place: { ...row.place }, placeUrl: row.placeUrl, result: { ...row.result } }
      : { name: { en: '', ro: '' }, date: '', place: { en: '', ro: '' }, placeUrl: '', result: { en: '', ro: '' } },
    validate: (v) => {
      const e: Errors = {};
      if (!v.name.en.trim()) e['name.en'] = 'Give the event a name.';
      if (!v.date.trim()) e.date = 'Enter the date.';
      else if (!isValidEventDate(v.date)) e.date = 'Use 2026-03-14, or 2026-03 or 2026 when the day is unknown.';
      if (!v.place.en.trim()) e['place.en'] = 'Say where it took place.';
      if (!isUrl(v.placeUrl)) e.placeUrl = 'Enter a full address that starts with https://.';
      return e;
    },
    save: (v) => save.mutateAsync({
      season: season.id, id: row?.id ?? null,
      input: {
        name: { en: v.name.en.trim(), ro: v.name.ro.trim() }, date: v.date.trim(), place: { en: v.place.en.trim(), ro: v.place.ro.trim() },
        placeUrl: v.placeUrl.trim(), result: { en: v.result.en.trim(), ro: v.result.ro.trim() },
      },
    }),
    onSaved: onClose,
  });
  return (
    <FormDialog title={row ? `Edit ${row.name.en}` : `Add an event to ${season.game}`} form={form} onClose={onClose} submit={row ? 'Save event' : 'Add event'}>
      <BilingualField name="name" label="Name" placeholder="SparkHope Robotics Cup" />
      <TextField name="date" label="Date" placeholder="2025-08-23" inputMode="numeric" hint="YYYY-MM-DD. Use YYYY-MM or YYYY when the exact day isn’t on record." />
      <BilingualField name="place" label="Location" placeholder="Bucharest, Romania" />
      <TextField name="placeUrl" label="Location link" type="url" optional placeholder="https://" hint="Text plus a link on the website, no map." />
      <BilingualField name="result" label="Result" optional placeholder="Winning alliance" />
    </FormDialog>
  );
}

function DeleteExtra({ row, onClose }: { row: ExtraEvent; onClose: () => void }) {
  const rm = useRemoveExtra();
  const [err, setErr] = useState<string | null>(null);
  return (
    <ConfirmDialog title={`Delete ${row.name.en}?`} confirm="Delete event" danger busy={rm.isPending} error={err} onCancel={onClose}
      body={<p>This removes the event and its result from the website on the next Publish. Awards won there stay in the Awards tab, just no longer linked to it.</p>}
      onConfirm={() => rm.mutate(row.id, { onSuccess: onClose, onError: (e) => setErr(e instanceof Error ? e.message : 'Try again.') })} />
  );
}
