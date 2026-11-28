import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useSearch } from '../lib/data/search';
import { hasCms, moduleById, modulesFor } from '../lib/modules';
import type { Session } from '../lib/data';
import { useGo } from '../lib/nav';
import { useMedia, WIDE } from '../lib/media';
import { Icon } from './icons';
import type { IconName } from './icons';

interface Option { id: string; label: string; hint: string; icon: IconName; href?: string; action?: 'publish' }
interface Group { id: string; label: string; options: Option[] }

/** Dispatched by the ⌘K / "/" shortcut: the inline field takes focus, selects its text and drops its results. */
export const JUMP_FOCUS = 'brickbot:jump-focus';

const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

/** Extra words a module answers to, besides its label. Descriptions are not searched: they matched too much. */
const ALIASES: Record<string, string[]> = {
  blog: ['posts', 'bricklog', 'news', 'topics'],
  seasons: ['events', 'awards', 'results'],
  team: ['team', 'story', 'timeline', 'mission', 'impact', 'join'],
  gallery: ['photos', 'videos', 'clips'],
  projects: ['project tags'],
  support: ['sponsors', 'tiers', 'budget', 'deck', 'contract'],
  'home-faq': ['hero', 'faq', 'form 230'],
  press: ['press', 'logos'],
  settings: ['contact', 'address', 'iban', 'socials'],
  linktree: ['links', 'cards'],
  'short-urls': ['redirects', 'slugs', 'urls'],
  media: ['files', 'upload', 'images', 'cdn'],
  users: ['invite', 'members', 'accounts'],
  permissions: ['roles', 'access'],
  audit: ['history', 'changes'],
};
/** With item hits on screen, no more than this many module matches sit beside them. */
const MAX_MODULES_WITH_ITEMS = 3;

/** The options for a query: items (projects, sponsors, posts, seasons), modules matched by label and aliases (permission-filtered), actions. */
function useJumpGroups(query: string, session: Session): { groups: Group[]; searching: boolean } {
  const q = norm(query.trim());
  const search = useSearch(q ? query : '', session);
  return useMemo(() => {
    const groups: Group[] = [];
    const hits = q ? search.data ?? [] : [];
    let mods = modulesFor(session.permissions).filter((m) => m.id !== 'home');
    if (q) {
      const exact = (m: { id: string; label: string }) => norm(m.label).startsWith(q) || (ALIASES[m.id] ?? []).some((al) => norm(al) === q);
      const rank = (m: { id: string; label: string }) => (exact(m) ? 0 : norm(m.label).includes(q) ? 1 : 2);
      mods = mods
        .filter((m) => norm(m.label).includes(q) || (ALIASES[m.id] ?? []).some((al) => norm(al).includes(q)))
        .sort((a, b) => rank(a) - rank(b));
      if (hits.length) mods = mods.slice(0, MAX_MODULES_WITH_ITEMS);
    }
    const exactFirst = !!q && mods.length > 0 && (norm(mods[0].label).startsWith(q) || (ALIASES[mods[0].id] ?? []).some((al) => norm(al) === q));
    const modGroup: Group | null = mods.length ? { id: 'modules', label: 'Modules', options: mods.map((m) => ({ id: `m-${m.id}`, label: m.label, hint: m.blurb, icon: m.icon, href: m.path })) } : null;

    // Items come from the modules' search providers (the aggregator already limits them to what the member may use).
    const itemGroup: Group | null = hits.length ? { id: 'items', label: 'Items', options: hits.map((h) => ({ id: `i-${h.module}-${h.id}`, label: h.label, hint: h.hint, icon: moduleById(h.module)?.icon ?? 'arrow', href: h.href })) } : null;

    // A module whose name starts with the query (or that has it as an alias) leads: typing "blog" goes to Blog. Otherwise the real items do.
    const modulesLead = !q || (mods.length > 0 && exactFirst);
    for (const g of modulesLead ? [modGroup, itemGroup] : [itemGroup, modGroup]) if (g) groups.push(g);

    if (q && hasCms(session.permissions) && ['publish', 'go live', 'deploy', 'build'].some((k) => k.includes(q))) {
      groups.push({ id: 'actions', label: 'Actions', options: [{ id: 'a-publish', label: 'Publish…', hint: 'Make saved changes live', icon: 'bolt', action: 'publish' }] });
    }
    return { groups, searching: !!q && search.isFetching && !search.data };
  }, [q, session.permissions, search.data, search.isFetching]);
}

/**
 * The jump field: one component for the inline field on Home and the ⌘K overlay. Accessible combobox: the input owns
 * focus, the listbox is reached with arrow keys (aria-activedescendant), Enter opens, Esc closes.
 */
export function JumpCombobox({ session, variant, autoFocus, onClose, onPublish, inputRef }: {
  session: Session;
  variant: 'inline' | 'overlay';
  autoFocus?: boolean;
  onClose?: () => void;
  onPublish: () => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [summoned, setSummoned] = useState(false);
  const own = useRef<HTMLInputElement>(null);
  const input = inputRef ?? own;
  const listId = useId();
  const go = useGo();
  const narrow = !useMedia(WIDE);
  const { groups, searching } = useJumpGroups(query, session);
  const flat = useMemo(() => groups.flatMap((g) => g.options), [groups]);
  const typed = query.trim().length > 0;
  // Inline: the list drops down only while typing. Overlay: always open, an empty query lists the modules.
  const open = variant === 'overlay' || ((typed || summoned) && !dismissed);
  const optId = (i: number) => `${listId}-o${i}`;

  useEffect(() => { setActive(0); }, [query]);
  useEffect(() => {
    if (variant !== 'inline') return;
    const summon = () => { setDismissed(false); setSummoned(true); input.current?.focus(); input.current?.select(); };
    window.addEventListener(JUMP_FOCUS, summon);
    return () => window.removeEventListener(JUMP_FOCUS, summon);
  }, [variant, input]);
  useEffect(() => { if (autoFocus) input.current?.focus(); }, [autoFocus, input]);
  useEffect(() => {
    if (open) document.getElementById(optId(active))?.scrollIntoView({ block: 'nearest' });
  }, [active, open]); // eslint-disable-line react-hooks/exhaustive-deps

  const choose = (o: Option | undefined) => {
    if (!o) return;
    onClose?.();
    setQuery('');
    if (o.action === 'publish') onPublish();
    else if (o.href) go(o.href);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setDismissed(false);
      if (!flat.length) return;
      setActive((i) => (e.key === 'ArrowDown' ? (i + 1) % flat.length : (i - 1 + flat.length) % flat.length));
    } else if (e.key === 'Enter') {
      if (open && flat.length) { e.preventDefault(); choose(flat[active]); }
    } else if (e.key === 'Escape') {
      if (variant === 'overlay') { e.preventDefault(); onClose?.(); }
      else if (typed) { e.preventDefault(); if (open) setDismissed(true); else setQuery(''); }
    } else if (e.key === 'Tab' && variant === 'overlay') {
      e.preventDefault();
    }
  };

  const mac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  let n = -1;

  return (
    <div className={`jump jump--${variant}`}>
      <div className="cmd">
        <Icon name="search" className="i cmd__icon" />
        <input
          ref={input}
          className="cmd__input"
          type="text"
          role="combobox"
          aria-label="Jump to a module, post, sponsor, season"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && flat.length ? optId(active) : undefined}
          placeholder={narrow ? 'Jump to a module or item…' : 'Jump to a module, post, sponsor, season…'}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          enterKeyHint="go"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setDismissed(false); }}
          onKeyDown={onKey}
          onBlur={() => setSummoned(false)}
        />
        <span className="kbd" aria-hidden="true">
          <kbd>{mac ? '⌘' : 'Ctrl'}</kbd><kbd>K</kbd>
        </span>
      </div>
      <div className="jump__list" id={listId} role="listbox" aria-label="Results" hidden={!open}>
        {groups.map((g) => (
          <div key={g.id} role="group" aria-labelledby={`${listId}-${g.id}`}>
            <div className="jump__group label" id={`${listId}-${g.id}`}>{g.label}</div>
            {g.options.map((o) => {
              n += 1;
              const i = n;
              return (
                <div
                  key={o.id}
                  id={optId(i)}
                  role="option"
                  aria-selected={i === active}
                  className="opt"
                  onPointerMove={() => i !== active && setActive(i)}
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => choose(o)}
                >
                  <Icon name={o.icon} className="i opt__icon" />
                  <span className="opt__label">{o.label}</span>
                  <span className="opt__hint">{o.hint}</span>
                  <Icon name="arrow" className="i opt__arrow" />
                </div>
              );
            })}
          </div>
        ))}
        {!flat.length && (
          <p className="jump__empty">{searching ? 'Searching…' : <>Nothing matches <b>{query.trim()}</b>. Try a module name, a sponsor or a post title.</>}</p>
        )}
      </div>
      <p className="sr-only" role="status" aria-live="polite">{open ? (flat.length ? `${flat.length} results` : searching ? '' : 'No results') : ''}</p>
    </div>
  );
}
