import { useRef, useState } from 'react';
import { useLinktree, useSaveLinktree } from './data/hooks';
import type { Linktree } from './data/types';
import { useReorderSocials, useSettings } from '../settings/data/hooks';
import type { Network, SiteSettings } from '../settings/data/types';
import { networkLabel } from '../settings/networks';
import { AppLink } from '../../components/AppLink';
import { Callout, DateField, FileField, Repeater, Section, SettingsError, SettingsPage, SettingsSkeleton, TextField, ToggleField } from '../../components/edit';
import { Icon } from '../../components/icons';
import { formatDate } from '../../lib/dates';
import type { Errors } from '../../lib/form';
import { setPath, uid, useEditForm, useForm } from '../../lib/form';
import { isUrl } from '../../lib/format';
import { PhonePreview } from './PhonePreview';
import { cardStatus, todayKey } from './status';

interface CardRow { k: string; title: string; display: string; href: string; icon: string | null; highlighted: boolean; start: string; end: string }
export interface LinktreeForm { cards: CardRow[]; order: Network[] }

const toForm = (t: Linktree, s: SiteSettings): LinktreeForm => ({
  cards: t.cards.map((c) => ({ k: c.id, title: c.title, display: c.display, href: c.href, icon: c.icon, highlighted: c.highlighted, start: c.start, end: c.end })),
  order: s.socials.map((x) => x.network),
});

function validate(f: LinktreeForm): Errors {
  const e: Errors = {};
  f.cards.forEach((c, i) => {
    if (!c.title.trim()) e[`cards.${i}.title`] = 'Write the text of the card.';
    if (!c.href.trim()) e[`cards.${i}.href`] = 'Enter where the card goes.';
    else if (!isUrl(c.href) || !/^https?:\/\//i.test(c.href.trim())) e[`cards.${i}.href`] = 'Enter a full address that starts with https://.';
    if (c.start && c.end && c.end < c.start) e[`cards.${i}.end`] = 'The end must be on or after the start.';
  });
  return e;
}

export function LinktreeScreen() {
  const tree = useLinktree();
  const settings = useSettings();
  if (tree.isPending || settings.isPending) return <SettingsSkeleton />;
  if (tree.isError || settings.isError) return <SettingsError text="Couldn’t load the linktree." onRetry={() => { void tree.refetch(); void settings.refetch(); }} />;
  return <LinktreeEditor tree={tree.data} settings={settings.data} />;
}

function LinktreeEditor({ tree, settings }: { tree: Linktree; settings: SiteSettings }) {
  const saveCards = useSaveLinktree();
  const reorder = useReorderSocials();
  const initial = toForm(tree, settings);
  const form = useEditForm<LinktreeForm>({
    initial,
    validate,
    save: async (v) => {
      await saveCards.mutateAsync({ cards: v.cards.map((c) => ({ id: c.k, title: c.title.trim(), display: c.display.trim(), href: c.href.trim(), icon: c.icon, highlighted: c.highlighted, start: c.start, end: c.end })) });
      if (v.order.join() !== settings.socials.map((s) => s.network).join()) await reorder.mutateAsync(v.order);
    },
  });
  const latest = { by: tree.editedBy, at: tree.editedAt };
  const [view, setView] = useState<'edit' | 'preview'>('edit');

  return (
    <div className="lt" data-view={view}>
      <div className="lt__switch">
        <div className="seg" role="radiogroup" aria-label="Show">
          {([['edit', 'Edit'], ['preview', 'Preview']] as const).map(([v, label]) => (
            <label key={v} className="seg__opt">
              <input type="radio" name="lt-view" value={v} className="sr-only" checked={view === v} onChange={() => setView(v)} />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>
      <SettingsPage form={form} title="Linktree" edited={latest} viewHref={import.meta.env.VITE_LINKS_URL}>
        <p className="lt__lead">English only. Cards with dates appear and disappear by themselves; the page checks the dates in the visitor’s browser too, so no rebuild is needed.</p>
        <Section title="Link cards" note="From top to bottom as on the page. Highlighted cards stand out.">
          <Repeater name="cards" label="Cards" itemLabel="Card" addLabel="Add a card" empty="No cards yet. The page shows only the logo and the social icons."
            blank={() => ({ k: uid(), title: '', display: '', href: '', icon: null, highlighted: false, start: '', end: '' })}>
            {(i) => (
              <>
                <CardStatusLine i={i} />
                <TextField name={`cards.${i}.title`} label="Text" multiline />
                <TextField name={`cards.${i}.href`} label="Goes to" type="url" placeholder="https://" />
                <TextField name={`cards.${i}.display`} label="Shown address" optional placeholder="brickbot.ro/apply" hint="The short address under the text. Empty shows the target without https://." />
                <FileField name={`cards.${i}.icon`} label="Icon" kind="svg" folders={['links/icons/']} tile="dark" optional compact />
                <ToggleField name={`cards.${i}.highlighted`} label="Highlighted" hint="Draws the card with a yellow edge so it stands out." />
                <div className="lt__dates">
                  <DateField name={`cards.${i}.start`} label="Visible from" optional hint="Empty: from now on." />
                  <DateField name={`cards.${i}.end`} label="Visible until" optional hint="Through this day. Empty: no end." />
                </div>
              </>
            )}
          </Repeater>
        </Section>
        <Section title="Social icons" note="The order of the icons under the logo.">
          <Callout>The addresses are edited in <AppLink href="/settings#socials" className="link">Site settings</AppLink>, because the website uses the same list. Only the order is set here.</Callout>
          <SocialOrder />
        </Section>
      </SettingsPage>
      <PhonePreview form={form} />
    </div>
  );
}

/** "Visible now", "Scheduled" or "Expired", from the card's own dates. */
function CardStatusLine({ i }: { i: number }) {
  const form = useForm();
  const c = (form.get(`cards.${i}`) as CardRow | undefined);
  if (!c) return null;
  const s = cardStatus(c, todayKey());
  const text = s === 'visible'
    ? c.end ? `Visible now, until ${formatDate(c.end)}` : 'Visible now'
    : s === 'scheduled' ? `Scheduled, from ${formatDate(c.start)}` : `Expired, ended ${formatDate(c.end)}`;
  return <p className="lt__status" data-status={s}><span className="lt__dot" aria-hidden="true" />{text}</p>;
}

/** The socials of Site settings as a list the member can reorder. */
function SocialOrder() {
  const form = useForm();
  const order = (form.get('order') as Network[]) ?? [];
  const [note, setNote] = useState('');
  const focus = useRef<string | null>(null);
  const root = useRef<HTMLOListElement>(null);
  const move = (i: number, to: number) => {
    const id = order[i];
    form.update((v) => { const a = [...(v.order as Network[])]; [a[i], a[to]] = [a[to], a[i]]; return setPath(v, 'order', a); });
    setNote(`${networkLabel(id)} moved to position ${to + 1} of ${order.length}.`);
    focus.current = `${id}:${to < i ? 'up' : 'down'}`;
    requestAnimationFrame(() => {
      const el = root.current?.querySelector<HTMLElement>(`[data-act="${focus.current}"]:not(:disabled)`) ?? root.current?.querySelector<HTMLElement>(`[data-act="${id}:${to < i ? 'down' : 'up'}"]:not(:disabled)`);
      el?.focus();
    });
  };
  if (!order.length) return <p className="lt__status">No social links are set in Site settings yet.</p>;
  return (
    <>
      <ol className="lt__order" ref={root}>
        {order.map((n, i) => (
          <li key={n} className="lt__orow">
            <span className="lt__ono tnum" aria-hidden="true">{i + 1}</span>
            <span className="lt__oname">{networkLabel(n)}</span>
            <span className="lt__obtns">
              <button type="button" className="iconbtn iconbtn--sm" data-act={`${n}:up`} aria-label={`Move ${networkLabel(n)} up`} disabled={i === 0} onClick={() => move(i, i - 1)}><Icon name="up" /></button>
              <button type="button" className="iconbtn iconbtn--sm" data-act={`${n}:down`} aria-label={`Move ${networkLabel(n)} down`} disabled={i === order.length - 1} onClick={() => move(i, i + 1)}><Icon name="down" /></button>
            </span>
          </li>
        ))}
      </ol>
      <p className="sr-only" role="status">{note}</p>
    </>
  );
}
