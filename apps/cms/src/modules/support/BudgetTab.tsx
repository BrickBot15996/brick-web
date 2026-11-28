import { useNavigate, useParams } from '@tanstack/react-router';
import { useBudget, useSaveBudget } from './data/hooks';
import type { SeasonBudget, SeasonBudgetInput } from './data/types';
import { useSeasons } from '../../lib/data/hooks';
import { BilingualField, Callout, NumberField, Repeater, Section, SettingsError, SettingsPage, SettingsSkeleton } from '../../components/edit';
import type { Errors } from '../../lib/form';
import { uid, useEditForm, useForm } from '../../lib/form';
import { slugify } from '../../lib/slug';
import { euro } from './money';

interface BudgetForm { categories: { k: string; id: string; name: { en: string; ro: string }; amount: number | null }[]; remaining: number | null }

const toForm = (b: SeasonBudget | null): BudgetForm => ({
  categories: (b?.categories ?? []).map((c) => ({ k: uid(), id: c.id, name: { ...c.name }, amount: c.amount })),
  remaining: b ? b.remaining : null,
});

function validate(f: BudgetForm): Errors {
  const e: Errors = {};
  f.categories.forEach((c, i) => {
    if (!c.name.en.trim()) e[`categories.${i}.name.en`] = 'Name the category.';
    if (c.amount === null) e[`categories.${i}.amount`] = 'Enter the amount spent in euros.';
    else if (c.amount < 0) e[`categories.${i}.amount`] = 'Use 0 or more.';
  });
  if (f.remaining === null) e.remaining = 'Enter what is left, or 0.';
  else if (f.remaining < 0) e.remaining = 'Use 0 or more.';
  return e;
}

function toInput(f: BudgetForm): SeasonBudgetInput {
  const taken = new Set(f.categories.map((c) => c.id).filter(Boolean));
  return {
    categories: f.categories.map((c) => {
      let id = c.id;
      if (!id) { id = slugify(c.name.en) || 'category'; while (taken.has(id)) id += '-2'; taken.add(id); }
      return { id, name: { en: c.name.en.trim(), ro: c.name.ro.trim() }, amount: c.amount ?? 0 };
    }),
    remaining: f.remaining ?? 0,
  };
}

/** /support/budget/$season */
export function BudgetTab() {
  const { season } = useParams({ strict: false }) as { season: string };
  const seasons = useSeasons();
  const q = useBudget(season);
  if (q.isPending || seasons.isPending) return <SettingsSkeleton />;
  if (q.isError) return <SettingsError text="Couldn’t load this budget." onRetry={() => void q.refetch()} />;
  return <BudgetEditor key={season} season={season} budget={q.data} />;
}

function BudgetEditor({ season, budget }: { season: string; budget: SeasonBudget | null }) {
  const seasons = useSeasons().data ?? [];
  const navigate = useNavigate();
  const save = useSaveBudget();
  const info = seasons.find((s) => s.id === season);
  const form = useEditForm<BudgetForm>({ initial: toForm(budget), validate, save: (v) => save.mutateAsync({ season, input: toInput(v) }) });
  return (
    <SettingsPage form={form} title="Budget" edited={budget ? { by: budget.editedBy, at: budget.editedAt } : null} viewHref={`${import.meta.env.VITE_WEBSITE_URL}/en/partners`}>
      <label className="field sup-season">
        <span className="field__label">Season</span>
        <select className="input input--select" value={season} onChange={(e) => void navigate({ to: `/support/budget/${e.target.value}` })}>
          {seasons.map((s) => <option key={s.id} value={s.id}>{s.game} {s.years}{s.current ? ' (current)' : ''}</option>)}
        </select>
        <span className="field__hint">Partner with Us shows the previous season’s spending. Keep each season’s numbers here.</span>
      </label>
      {!budget && <Callout>No spending is recorded for {info ? `${info.game} ${info.years}` : 'this season'} yet. Until it is, Partner with Us says the accounts are being closed.</Callout>}
      <Section title="Overview" note="Each bar is the share of all the season’s money (spent plus remaining).">
        <BudgetBars />
      </Section>
      <Section title="Spending" note="Euros only, what was spent. Make up the categories as you need them.">
        <Repeater name="categories" label="Categories" itemLabel="Category" addLabel="Add a category" empty="No categories yet." blank={() => ({ k: uid(), id: '', name: { en: '', ro: '' }, amount: null })}>
          {(i) => (
            <>
              <BilingualField name={`categories.${i}.name`} label="Name" />
              <NumberField name={`categories.${i}.amount`} label="Spent" unit="€" min={0} step={50} integer />
            </>
          )}
        </Repeater>
      </Section>
      <Section title="Remaining money">
        <NumberField name="remaining" label="Left at the end of the season" unit="€" min={0} step={50} integer hint="Money that was not spent. It is shown beside the categories." />
      </Section>
    </SettingsPage>
  );
}

function BudgetBars() {
  const f = useForm() as unknown as { values: BudgetForm };
  const { categories, remaining } = f.values;
  const spent = categories.reduce((n, c) => n + (c.amount ?? 0), 0);
  const left = remaining ?? 0;
  const total = spent + left;
  if (!categories.length && !left) return <p className="sup-none">Add a category to see where the money went.</p>;
  const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0);
  return (
    <div className="sup-budget">
      <dl className="sup-totals">
        <div><dt>Spent</dt><dd className="tnum">{euro(spent)}</dd></div>
        <div><dt>Remaining</dt><dd className="tnum">{euro(left)}</dd></div>
        <div><dt>All money</dt><dd className="tnum">{euro(total)}</dd></div>
      </dl>
      <ul className="sup-bars">
        {categories.map((c) => (
          <li key={c.k} className="sup-bar">
            <span className="sup-bar__name">{c.name.en || <i>Unnamed</i>}</span>
            <span className="sup-bar__track" role="img" aria-label={`${pct(c.amount ?? 0).toFixed(0)} percent`}><span className="sup-bar__fill" style={{ width: `${pct(c.amount ?? 0)}%` }} /></span>
            <span className="sup-bar__val tnum">{euro(c.amount ?? 0)}<small>{pct(c.amount ?? 0).toFixed(0)}%</small></span>
          </li>
        ))}
        <li className="sup-bar sup-bar--left">
          <span className="sup-bar__name">Remaining</span>
          <span className="sup-bar__track" role="img" aria-label={`${pct(left).toFixed(0)} percent`}><span className="sup-bar__fill" style={{ width: `${pct(left)}%` }} /></span>
          <span className="sup-bar__val tnum">{euro(left)}<small>{pct(left).toFixed(0)}%</small></span>
        </li>
      </ul>
    </div>
  );
}
