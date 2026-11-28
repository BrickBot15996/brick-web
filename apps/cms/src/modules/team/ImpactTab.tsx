import { BilingualField, Callout, NumberField, Section, SettingsError, SettingsPage, SettingsSkeleton, TextField } from '../../components/edit';
import type { Errors } from '../../lib/form';
import { useEditForm } from '../../lib/form';
import { useImpact, useSaveImpact } from './data/hooks';
import type { Impact, ImpactInput } from './data/types';

const WEBSITE = import.meta.env.VITE_WEBSITE_URL;

interface Form { numbers: { id: string; value: number | null; suffix: string; label: { en: string; ro: string } }[] }

const NAMES: Record<string, string> = { years: 'Years active', awards: 'Total awards', reached: 'People reached', events: 'Outreach events' };

const toForm = (i: Impact): Form => ({ numbers: i.numbers.map((n) => ({ ...n, label: { ...n.label } })) });
const fromForm = (f: Form): ImpactInput => ({
  numbers: f.numbers.map((n) => ({ id: n.id as Impact['numbers'][number]['id'], value: n.value, suffix: n.suffix.trim(), label: { en: n.label.en.trim(), ro: n.label.ro.trim() } })),
});
function validate(f: Form): Errors {
  const e: Errors = {};
  f.numbers.forEach((n, i) => {
    if (n.value === null) e[`numbers.${i}.value`] = 'Enter the number.';
    else if (n.value < 0) e[`numbers.${i}.value`] = 'The number can’t be negative.';
    if (!n.label.en.trim()) e[`numbers.${i}.label.en`] = 'Add the label.';
  });
  return e;
}

export function ImpactTab() {
  const q = useImpact();
  if (q.isPending) return <SettingsSkeleton />;
  if (q.isError) return <SettingsError onRetry={() => void q.refetch()} text="Couldn’t load the impact numbers." />;
  return <ImpactEditor impact={q.data} />;
}

function ImpactEditor({ impact }: { impact: Impact }) {
  const save = useSaveImpact();
  const form = useEditForm<Form>({ initial: toForm(impact), validate, save: (v) => save.mutateAsync(fromForm(v)) });
  return (
    <SettingsPage form={form} title="Impact numbers" edited={{ by: impact.editedBy, at: impact.editedAt }} viewHref={`${WEBSITE}/en`}>
      <Callout>These are typed in by hand. They can’t be counted from the data, because Romanian teams weren’t registered with FIRST before 2020. Update them when the team reaches a new milestone.</Callout>
      {form.values.numbers.map((n, i) => (
        <Section key={n.id} title={NAMES[n.id] ?? n.id}>
          <div className="team-num">
            <NumberField name={`numbers.${i}.value`} label="Number" integer min={0} />
            <TextField name={`numbers.${i}.suffix`} label="Suffix" optional placeholder="+" hint="Shown right after the number." />
          </div>
          <BilingualField name={`numbers.${i}.label`} label="Label" />
        </Section>
      ))}
    </SettingsPage>
  );
}
