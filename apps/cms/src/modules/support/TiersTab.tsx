import { useTierPlan, useSaveTierPlan } from './data/hooks';
import type { TierPlan, TierPlanInput } from './data/types';
import { Callout, BilingualField, NumberField, Repeater, Section, SettingsError, SettingsPage, SettingsSkeleton } from '../../components/edit';
import { Icon } from '../../components/icons';
import type { Errors } from '../../lib/form';
import { uid, useEditForm, useForm } from '../../lib/form';
import { slugify } from '../../lib/slug';
import { euro } from './money';

interface TierRow { k: string; id: string; name: { en: string; ro: string }; amount: number | null; benefits: number | null }
interface BenefitRow { k: string; text: { en: string; ro: string } }
interface TiersForm { tiers: TierRow[]; benefits: BenefitRow[] }

const toForm = (p: TierPlan): TiersForm => ({
  tiers: p.tiers.map((t) => ({ k: uid(), id: t.id, name: { ...t.name }, amount: t.amount, benefits: t.benefits })),
  benefits: p.benefits.map((b) => ({ k: uid(), text: { ...b.text } })),
});

function validate(f: TiersForm): Errors {
  const e: Errors = {};
  const n = f.benefits.length;
  const seen = new Set<string>();
  f.tiers.forEach((t, i) => {
    const prev = f.tiers[i - 1];
    const key = t.name.en.trim().toLowerCase();
    if (!key) e[`tiers.${i}.name.en`] = 'Give the tier a name.';
    else if (seen.has(key)) e[`tiers.${i}.name.en`] = 'Another tier already has this name.';
    seen.add(key);
    if (t.amount === null) e[`tiers.${i}.amount`] = 'Enter the amount in euros.';
    else if (t.amount <= 0) e[`tiers.${i}.amount`] = 'Use an amount above 0.';
    else if (prev && prev.amount !== null && t.amount <= prev.amount) e[`tiers.${i}.amount`] = `Tiers go up: this must be above ${euro(prev.amount)}.`;
    if (t.benefits === null) e[`tiers.${i}.benefits`] = 'Enter how many benefits it includes (0 or more).';
    else if (t.benefits > n) e[`tiers.${i}.benefits`] = n ? `There are only ${n} benefits.` : 'Add the benefits first.';
    else if (prev && prev.benefits !== null && t.benefits < prev.benefits) e[`tiers.${i}.benefits`] = `A higher tier includes at least what the one before does (${prev.benefits}).`;
  });
  f.benefits.forEach((b, i) => { if (!b.text.en.trim()) e[`benefits.${i}.text.en`] = 'Write the benefit.'; });
  return e;
}

function toInput(f: TiersForm): TierPlanInput {
  const taken = new Set(f.tiers.map((t) => t.id).filter(Boolean));
  return {
    tiers: f.tiers.map((t) => {
      let id = t.id;
      if (!id) {
        id = slugify(t.name.en) || 'tier';
        while (taken.has(id)) id += '-2';
        taken.add(id);
      }
      return { id, name: { en: t.name.en.trim(), ro: t.name.ro.trim() }, amount: t.amount ?? 0, benefits: t.benefits ?? 0 };
    }),
    benefits: f.benefits.map((b) => ({ text: { en: b.text.en.trim(), ro: b.text.ro.trim() } })),
  };
}

export function TiersTab() {
  const q = useTierPlan();
  if (q.isPending) return <SettingsSkeleton />;
  if (q.isError) return <SettingsError text="Couldn’t load the tiers." onRetry={() => void q.refetch()} />;
  return <TiersEditor plan={q.data} />;
}

function TiersEditor({ plan }: { plan: TierPlan }) {
  const save = useSaveTierPlan();
  const form = useEditForm<TiersForm>({ initial: toForm(plan), validate, save: (v) => save.mutateAsync(toInput(v)) });
  return (
    <SettingsPage form={form} title="Sponsorship tiers" edited={{ by: plan.editedBy, at: plan.editedAt }} viewHref={`${import.meta.env.VITE_WEBSITE_URL}/en/partners`}>
      <Callout>Which tier a sponsor belongs to stays internal. These <b>names, amounts and benefits</b> are public: they make up the package table on Partner with Us.</Callout>
      <Section title="Tiers" note="Lowest first. This order is the order on the page. “Benefits included” counts from the top of the list below.">
        <Repeater name="tiers" label="Tiers" itemLabel="Tier" addLabel="Add a tier" empty="No tiers yet." blank={() => ({ k: uid(), id: '', name: { en: '', ro: '' }, amount: null, benefits: null })}>
          {(i) => (
            <>
              <BilingualField name={`tiers.${i}.name`} label="Name" />
              <div className="sup-pair">
                <NumberField name={`tiers.${i}.amount`} label="From" unit="€" min={0} step={100} integer />
                <NumberField name={`tiers.${i}.benefits`} label="Benefits included" min={0} max={20} integer />
              </div>
            </>
          )}
        </Repeater>
      </Section>
      <Section title="Benefits" note="One list, in order. Each tier gets the first N, so every tier includes everything in the ones before it.">
        <Repeater name="benefits" label="Benefits" itemLabel="Benefit" addLabel="Add a benefit" empty="No benefits yet." blank={() => ({ k: uid(), text: { en: '', ro: '' } })}>
          {(i) => <BilingualField name={`benefits.${i}.text`} label="Benefit" />}
        </Repeater>
      </Section>
      <Section title="Preview" note="The package table as visitors will read it, in English.">
        <TierMatrix />
      </Section>
    </SettingsPage>
  );
}

/** Benefits down the side, tiers across the top, a tick where a tier includes a benefit. Reads the live form. */
function TierMatrix() {
  const f = useForm() as unknown as { values: TiersForm };
  const { tiers, benefits } = f.values;
  if (!tiers.length || !benefits.length) return <p className="sup-none">Add a tier and a benefit to see the table.</p>;
  return (
    <div className="sup-scroll" role="region" aria-label="Tier by benefit table" tabIndex={0}>
      <table className="sup-matrix">
        <thead>
          <tr>
            <th scope="col"><span className="sr-only">Benefit</span></th>
            {tiers.map((t) => (
              <th scope="col" key={t.k}>
                <span className="sup-matrix__name">{t.name.en || 'Unnamed'}</span>
                <span className="sup-matrix__price tnum">{t.amount === null ? '' : `from ${euro(t.amount)}`}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {benefits.map((b, bi) => (
            <tr key={b.k}>
              <th scope="row">{b.text.en || <i>Unwritten</i>}</th>
              {tiers.map((t) => {
                const on = bi < (t.benefits ?? 0);
                return (
                  <td key={t.k} data-on={on}>
                    {on ? <><Icon name="check" className="i" /><span className="sr-only">Included</span></> : <><span className="sup-matrix__no" aria-hidden="true" /><span className="sr-only">Not included</span></>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
