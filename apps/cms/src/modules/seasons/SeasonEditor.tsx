import { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { useSeasonRecords, useSetCurrentSeason, useUpdateSeason } from './data/hooks';
import type { SeasonInput, SeasonRecord } from './data/types';
import { isUrl } from '../../lib/format';
import type { Errors } from '../../lib/form';
import { useEditForm } from '../../lib/form';
import { EditorFrame, EditorMissing, EditorSkeleton, FileField, NumberField, Section, TextField } from '../../components/edit';
import { EventsSection } from './EventsSection';
import { ConfirmDialog } from './ui';
import { Tag } from '../../components/Tag';

const WEBSITE = import.meta.env.VITE_WEBSITE_URL;

interface SeasonForm {
  game: string; years: string; ftc: number | null; onshape: string;
  gameLogo: string | null; teamPhoto: string | null; robot: string | null; portfolioPdf: string | null; portfolioCover: string | null;
}

const toForm = (s: SeasonRecord): SeasonForm => ({
  game: s.game, years: s.years, ftc: s.ftc, onshape: s.onshape, gameLogo: s.gameLogo, teamPhoto: s.teamPhoto, robot: s.robot, portfolioPdf: s.portfolioPdf, portfolioCover: s.portfolioCover,
});
const toInput = (f: SeasonForm): SeasonInput => ({ ...f, game: f.game.trim(), years: f.years.trim(), onshape: f.onshape.trim() });

const isOnshape = (u: string) => { try { const h = new URL(u.trim()).hostname; return h === 'onshape.com' || h.endsWith('.onshape.com'); } catch { return false; } };

function validate(f: SeasonForm): Errors {
  const e: Errors = {};
  if (!f.game.trim()) e.game = 'Enter the game’s name.';
  const y = f.years.trim();
  if (!/^\d{4}[–-]\d{2}$/.test(y)) e.years = 'Write the years like 2025–26.';
  if (f.ftc !== null && (!Number.isInteger(f.ftc) || f.ftc < 2019 || f.ftc > 2100)) e.ftc = 'Use the season’s start year, like 2025.';
  if (!isUrl(f.onshape)) e.onshape = 'Enter a full address that starts with https://.';
  else if (f.onshape.trim() && !isOnshape(f.onshape)) e.onshape = 'This should be a public Onshape document (cad.onshape.com).';
  return e;
}

export function SeasonEdit() {
  const { id } = useParams({ strict: false }) as { id: string };
  const q = useSeasonRecords();
  if (q.isPending) return <EditorSkeleton />;
  const season = q.data?.find((s) => s.id === id);
  if (!season) return <EditorMissing noun="season" backHref="/seasons" backLabel="All seasons" />;
  return <SeasonEditor key={season.id} season={season} others={q.data ?? []} />;
}

function SeasonEditor({ season, others }: { season: SeasonRecord; others: SeasonRecord[] }) {
  const update = useUpdateSeason();
  const form = useEditForm<SeasonForm>({
    initial: toForm(season),
    validate,
    save: (v) => update.mutateAsync({ id: season.id, input: toInput(v) }),
  });
  const files = [`seasons/${season.id}/`];
  const [askCurrent, setAskCurrent] = useState(false);
  const setCurrent = useSetCurrentSeason();
  const [err, setErr] = useState<string | null>(null);
  const was = others.find((s) => s.current && s.id !== season.id);
  const title = `${season.game} ${season.years}`;

  return (
    <EditorFrame
      form={form}
      title={title}
      edited={{ by: season.editedBy, at: season.editedAt }}
      back={{ href: '/seasons', label: 'All seasons' }}
      viewHref={`${WEBSITE}/en/seasons/${season.id}`}
    >
      <Section title="Basics">
        <TextField name="game" label="Game name" placeholder="DECODE" />
        <div className="sea-pair">
          <TextField name="years" label="Years" placeholder="2025–26" />
          <NumberField name="ftc" label="FTC season code" optional integer placeholder="2025" hint="The start year. It selects the season in FTC Events; leave it empty for seasons before 2020." />
        </div>
        <div className="sea-cur">
          {season.current ? (
            <p className="sea-cur__t"><Tag lit>Current</Tag> The website’s Seasons page opens on this season. To change it, make another season current.</p>
          ) : (
            <>
              <p className="sea-cur__t">Not the current season.</p>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => { setErr(null); setAskCurrent(true); }}>Make current</button>
            </>
          )}
        </div>
      </Section>

      <Section title="Files" note={<>Stored under <code>seasons/{season.id}/</code> in the media library.</>}>
        <FileField name="gameLogo" label="Game logo" kind="image" tile="dark" folders={files} optional />
        <FileField name="teamPhoto" label="Team photo" kind="image" folders={files} optional />
        <FileField name="robot" label="Robot image" kind="image" folders={files} optional hint="On the website this image links to the Onshape document below." />
        <TextField name="onshape" label="Onshape document" type="url" optional placeholder="https://cad.onshape.com/documents/…" />
        <FileField name="portfolioPdf" label="Engineering portfolio" kind="pdf" folders={files} optional />
        <FileField name="portfolioCover" label="Portfolio cover" kind="image" folders={files} optional hint="The thumbnail shown beside the download." />
      </Section>

      <EventsSection season={season} />

      {askCurrent && (
        <ConfirmDialog
          title={`Make ${season.game} the current season?`}
          body={<p>{was ? <><b>{was.game} {was.years}</b> stops being current. </> : null}The website’s Seasons page, the home snapshot and the next event follow the current season from the next Publish. Only one season can be current.</p>}
          confirm="Make current" busy={setCurrent.isPending} error={err}
          onCancel={() => setAskCurrent(false)}
          onConfirm={() => setCurrent.mutate(season.id, { onSuccess: () => setAskCurrent(false), onError: (e) => setErr(e instanceof Error ? e.message : 'Try again.') })}
        />
      )}
    </EditorFrame>
  );
}
