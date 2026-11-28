import { useSupportDocs, useSaveDocs } from './data/hooks';
import type { SupportDocs, SupportDocsInput } from './data/types';
import { useSeasons } from '../../lib/data/hooks';
import { BilingualMarkdownField, FileField, Repeater, Section, SelectField, SettingsError, SettingsPage, SettingsSkeleton } from '../../components/edit';
import type { Errors } from '../../lib/form';
import { uid, useEditForm, useForm } from '../../lib/form';

interface DocsForm {
  decks: { k: string; season: string; file: string | null }[];
  contract: string | null;
  contractText: { en: string; ro: string };
}

const toForm = (d: SupportDocs): DocsForm => ({
  decks: d.decks.map((x) => ({ k: uid(), ...x })),
  contract: d.contract,
  contractText: { ...d.contractText },
});

function validate(f: DocsForm): Errors {
  const e: Errors = {};
  const seen = new Set<string>();
  f.decks.forEach((d, i) => {
    if (!d.season) e[`decks.${i}.season`] = 'Choose the season this deck is for.';
    else if (seen.has(d.season)) e[`decks.${i}.season`] = 'This season already has a deck.';
    seen.add(d.season);
    if (!d.file) e[`decks.${i}.file`] = 'Choose the PDF, or remove this row.';
  });
  return e;
}

const toInput = (f: DocsForm): SupportDocsInput => ({
  decks: f.decks.map((d) => ({ season: d.season, file: d.file })),
  contract: f.contract,
  contractText: { en: f.contractText.en.trim(), ro: f.contractText.ro.trim() },
});

/** "2026–27" → "2026-27", the §11 file name part. */
const fileYears = (years: string) => years.replace(/[–—]/g, '-');

export function DocumentsTab() {
  const q = useSupportDocs();
  const seasons = useSeasons();
  if (q.isPending || seasons.isPending) return <SettingsSkeleton />;
  if (q.isError) return <SettingsError text="Couldn’t load the documents." onRetry={() => void q.refetch()} />;
  return <DocsEditor docs={q.data} />;
}

function DocsEditor({ docs }: { docs: SupportDocs }) {
  const save = useSaveDocs();
  const form = useEditForm<DocsForm>({ initial: toForm(docs), validate, save: (v) => save.mutateAsync(toInput(v)) });
  const seasons = useSeasons().data ?? [];
  return (
    <SettingsPage form={form} title="Documents" edited={{ by: docs.editedBy, at: docs.editedAt }} viewHref={`${import.meta.env.VITE_WEBSITE_URL}/en/partners`}>
      <Section title="Sponsor deck" note="One PDF per season. Until a deck is uploaded, Partner with Us offers to email it instead.">
        <Repeater name="decks" label="Decks" itemLabel="Deck" addLabel="Add a deck" empty="No deck yet." blank={() => ({ k: uid(), season: seasons.find((s) => s.current)?.id ?? '', file: null })}>
          {(i) => (
            <>
              <SelectField name={`decks.${i}.season`} label="Season" placeholder="Choose a season" options={seasons.map((s) => ({ value: s.id, label: `${s.game} ${s.years}${s.current ? ' (current)' : ''}` }))} />
              <FileField name={`decks.${i}.file`} label="Deck (PDF)" kind="pdf" folders={['documents/']} hint={<DeckName i={i} />} />
            </>
          )}
        </Repeater>
      </Section>
      <Section title="Sample contract" note="The Partner with Us page links it under “How sponsorship contracts work”.">
        <FileField name="contract" label="Sample contract (PDF)" kind="pdf" folders={['documents/']} optional hint="Stored as documents/sample-contract.pdf." />
        <BilingualMarkdownField name="contractText" label="How sponsorship contracts work" hint="Shown beside the sample contract. Markdown: a blank line starts a new paragraph, “1.” starts a numbered list." />
      </Section>
    </SettingsPage>
  );
}

/** The hand-upload name the §11 tree expects for the chosen season. */
function DeckName({ i }: { i: number }) {
  const form = useForm();
  const seasons = useSeasons().data ?? [];
  const id = (form.get(`decks.${i}.season`) as string) ?? '';
  const years = seasons.find((s) => s.id === id)?.years;
  return <>{years ? <>Stored as documents/sponsor-deck-{fileYears(years)}.pdf.</> : 'Pick the season first to see the file name.'}</>;
}
