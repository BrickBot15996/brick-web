import { BilingualField, Callout, DateField, Section, SettingsError, SettingsPage, SettingsSkeleton, TextField } from '../../components/edit';
import type { Errors } from '../../lib/form';
import { useEditForm } from '../../lib/form';
import { isUrl } from '../../lib/format';
import { formatDate } from '../../lib/dates';
import { useForm230, useSaveForm230 } from './data/hooks';
import type { Form230, Form230Input } from './data/types';

const WEBSITE = import.meta.env.VITE_WEBSITE_URL;

interface Form { start: string; end: string; text: { en: string; ro: string }; link: string }

const toForm = (f: Form230): Form => ({ start: f.start, end: f.end, text: { ...f.text }, link: f.link });
const fromForm = (f: Form): Form230Input => ({ start: f.start, end: f.end, text: { en: f.text.en.trim(), ro: f.text.ro.trim() }, link: f.link.trim() });
function validate(f: Form): Errors {
  const e: Errors = {};
  if (!f.start) e.start = 'Choose the first day it shows.';
  if (!f.end) e.end = 'Choose the last day it shows.';
  if (f.start && f.end && f.end < f.start) e.end = 'The last day can’t be before the first.';
  if (!f.text.en.trim()) e['text.en'] = 'Write the callout text.';
  if (!f.link.trim()) e.link = 'Add the link people should open.';
  else if (!isUrl(f.link)) e.link = 'Enter a full address that starts with https://.';
  return e;
}

const todayIso = () => {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Bucharest', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  return p;
};

/** What visitors see today, from the dates in the form. */
function status(f: { start: string; end: string }): { on: boolean; text: string } {
  if (!f.start || !f.end) return { on: false, text: 'Hidden. Set both dates to show it.' };
  const t = todayIso();
  if (t < f.start) return { on: false, text: `Hidden today. It shows from ${formatDate(f.start)}.` };
  if (t > f.end) return { on: false, text: `Hidden today. It ended on ${formatDate(f.end)}.` };
  return { on: true, text: `Showing today, until ${formatDate(f.end)}.` };
}

export function Form230Tab() {
  const q = useForm230();
  if (q.isPending) return <SettingsSkeleton />;
  if (q.isError) return <SettingsError onRetry={() => void q.refetch()} text="Couldn’t load the Form 230 callout." />;
  return <Form230Editor data={q.data} />;
}

function Form230Editor({ data }: { data: Form230 }) {
  const save = useSaveForm230();
  const form = useEditForm<Form>({ initial: toForm(data), validate, save: (v) => save.mutateAsync(fromForm(v)) });
  const s = status(form.values);
  return (
    <SettingsPage form={form} title="Form 230 callout" edited={{ by: data.editedBy, at: data.editedAt }} viewHref={`${WEBSITE}/en`}>
      <Section title="Visibility" note="The callout shows on the home page only between these days, both included. The legal deadline is 25 May; set new dates each year.">
        <p className={`hf-status ${s.on ? 'hf-status--on' : ''}`} role="status"><span className="hf-status__dot" aria-hidden="true" /><span>{s.text}</span></p>
        <DateField name="start" label="First day" />
        <DateField name="end" label="Last day" />
      </Section>
      <Section title="Callout">
        <BilingualField name="text" label="Text" multiline softMax={160} />
        <TextField name="link" label="Link" type="url" hint="Legacy: formular230.ro/asociatia-brickbot. The short URL /formular230 points there too." />
      </Section>
      <Callout>The linktree has its own Form 230 card with its own dates, set in Linktree.</Callout>
    </SettingsPage>
  );
}
