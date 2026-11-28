import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { useRouterState } from '@tanstack/react-router';
import { cdn } from '../lib/cdn';
import { cms } from '../lib/data';
import type { Session } from '../lib/data';
import { GROUP_LABEL, hasCms, moduleForPath, modulesFor } from '../lib/modules';
import type { CmsModule, ModuleGroup } from '../lib/modules';
import { initials } from '../lib/format';
import { ROOMY, useMedia, WIDE } from '../lib/media';
import { ShellContext, useShell } from '../lib/shell';
import { AppLink } from './AppLink';
import { Icon } from './icons';
import { JumpPalette } from './JumpPalette';
import { PublishControl, PublishStatus } from './Publish';
import { Tag } from './Tag';

const WEBSITE = import.meta.env.VITE_WEBSITE_URL;
const LINKS = import.meta.env.VITE_LINKS_URL;
const brand = { '--logomark': `url(${cdn('brand/logo.svg')})`, '--wordmark': `url(${cdn('brand/wordmark.svg')})` } as CSSProperties;

/** Rail order: Home and the website modules, a separator, Links, a separator, then Media (every cms.* member has it, so it is not part of Links). Admin pins to the bottom. */
const RAIL_MID: ModuleGroup[] = ['links'];

/** The rail's labels on or off is remembered per browser; the app works without storage. Default: icons only. */
const RAIL_KEY = 'brickbot.cms.rail';
function readRail(): boolean {
  try { return localStorage.getItem(RAIL_KEY) === 'open'; } catch { return false; }
}
function writeRail(open: boolean) {
  try { localStorage.setItem(RAIL_KEY, open ? 'open' : 'closed'); } catch { /* storage blocked: the choice lasts for this visit only */ }
}

/** Shown only while the in-memory preview client is active, so made-up records are never mistaken for real ones. */
function SampleData() {
  if (!cms.preview) return null;
  return <span className="sample" title="Preview mode: this is sample data. Nothing here is saved to the team’s database."><Tag>Sample data</Tag></span>;
}

export function Shell({ session, children }: { session: Session; children: ReactNode }) {
  const wide = useMedia(WIDE);
  const roomy = useMedia(ROOMY);
  const [railPref, setRailPref] = useState(readRail);
  // Below 1200px the list and the editor need the room, so the rail stays icons only and the toggle is not offered.
  const railOpen = wide && roomy && railPref;
  const toggleRail = useCallback(() => setRailPref((o) => { writeRail(!o); return !o; }), []);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [headerSub, setHeaderSub] = useState<HTMLElement | null>(null);
  const [headerActions, setHeaderActions] = useState<HTMLElement | null>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const main = useRef<HTMLElement>(null);
  const lastPath = useRef(pathname);

  const openPalette = useCallback(() => { setSheetOpen(false); setPaletteOpen(true); }, []);
  const api = useMemo(() => ({ session, openPalette, publishOpen, setPublishOpen, headerSub, headerActions }), [session, openPalette, publishOpen, headerSub, headerActions]);
  const mod = moduleForPath(pathname);
  const title = mod && mod.id !== 'home' ? mod.label : null;

  // A route change moves focus to the page, so keyboard and screen-reader users start at its top.
  useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    setSheetOpen(false);
    setPublishOpen(false);
    // A route dialog that just closed has already handed focus back to its trigger: leave it there.
    const a = document.activeElement;
    if (!(a && a !== document.body && main.current?.contains(a) && !a.closest('[role=dialog]'))) main.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => { if (wide) setSheetOpen(false); }, [wide]);

  return (
    <ShellContext.Provider value={api}>
      <div className="app" style={brand} data-rail={railOpen ? 'open' : 'closed'}>
        <a className="skip" href="#main" onClick={(e) => { e.preventDefault(); main.current?.focus({ preventScroll: true }); }}>Skip to content</a>
        {wide ? <Rail session={session} pathname={pathname} open={railOpen} canToggle={roomy} onToggle={toggleRail} /> : <TopBar session={session} onMenu={() => setSheetOpen(true)} />}
        <main id="main" ref={main} tabIndex={-1} className="main">
          {!wide && (cms.preview || hasCms(session.permissions)) && <div className="pubstrip">{hasCms(session.permissions) && <PublishStatus />}<SampleData /></div>}
          {/* The page header: one row for every module. Title left (the module's name), the page's own actions, and on
              desktop the publish group as its rightmost items. Pages fill the sub line and the actions through PageHeader. */}
          <div className="phead" data-bare={title ? undefined : ''}>
            <div className="phead__id">
              {title && <h1 className="phead__title">{title}</h1>}
              <div className="phead__sub" ref={setHeaderSub} />
            </div>
            <div className="phead__actions" ref={setHeaderActions} />
            {wide && (cms.preview || hasCms(session.permissions)) && (
              <div className="phead__pub"><SampleData />{hasCms(session.permissions) && <><PublishStatus /><PublishControl /></>}</div>
            )}
          </div>
          {children}
        </main>
        {!wide && sheetOpen && <Sheet session={session} pathname={pathname} onClose={() => setSheetOpen(false)} />}
        <JumpPalette session={session} open={paletteOpen} onOpen={openPalette} onClose={() => setPaletteOpen(false)} onPublish={() => setPublishOpen(true)} />
      </div>
    </ShellContext.Provider>
  );
}

// ───────── desktop rail ─────────

function Rail({ session, pathname, open, canToggle, onToggle }: { session: Session; pathname: string; open: boolean; canToggle: boolean; onToggle: () => void }) {
  const mods = modulesFor(session.permissions);
  const inGroups = (gs: ModuleGroup[]) => mods.filter((m) => gs.includes(m.group));
  const media = mods.filter((m) => m.id === 'media');
  const general = mods.filter((m) => m.group === 'general' && m.id !== 'media');
  const website = inGroups(['website']), links = inGroups(RAIL_MID), admin = inGroups(['admin']);
  const current = moduleForPath(pathname)?.id;
  const [tip, setTip] = useState<{ label: string; y: number } | null>(null);
  useEffect(() => { if (open) setTip(null); }, [open]);

  // Tooltips name the icons while the rail is collapsed; open, the labels are already there.
  const show = (label: string) => (e: { currentTarget: HTMLElement }) => {
    if (open) return;
    const r = e.currentTarget.getBoundingClientRect();
    setTip({ label, y: r.top + r.height / 2 });
  };
  const hide = () => setTip(null);
  const item = (m: CmsModule, order?: number) => (
    <AppLink key={m.id} href={m.path} className="ri" style={order === undefined ? undefined : { order }} aria-label={open ? undefined : m.label} aria-current={current === m.id ? 'page' : undefined}
      onPointerEnter={show(m.label)} onPointerLeave={hide} onFocus={show(m.label)} onBlur={hide}>
      <Icon name={m.icon} /><span className="ri__label" aria-hidden={!open}>{m.label}</span>
    </AppLink>
  );
  // One list in both states, ordered with CSS `order`: Home, website, links, then Media behind its own separator (a caption when the
  // rail is open). Expanding only adds the labels and the group captions; nothing moves.
  const mediaOrder = 90;

  return (
    <aside id="rail" className="rail" data-open={open ? '' : undefined} aria-label="Modules" onKeyDown={(e) => e.key === 'Escape' && hide()}>
      <AppLink href="/" className="rail__brand" aria-label="BrickBot CMS home">
        <span className="mark rail__mark" aria-hidden="true" />
        <span className="word rail__word" aria-hidden="true" />
      </AppLink>
      <nav className="rail__nav" aria-label="CMS modules">
        {general.map((m) => item(m, 10))}
        {media.map((m) => item(m, mediaOrder))}
        {website.length > 0 && <span className="rail__cap label" aria-hidden="true" style={{ order: 18 }}>Website</span>}
        {website.map((m, i) => item(m, 20 + i))}
        {links.length > 0 && <span className="sep" role="separator" style={{ order: 38 }} />}
        {links.length > 0 && <span className="rail__cap label" aria-hidden="true" style={{ order: 39 }}>Links</span>}
        {links.map((m, i) => item(m, 40 + i))}
        {media.length > 0 && <span className="sep" role="separator" style={{ order: 80 }} />}
        {media.length > 0 && <span className="rail__cap label" aria-hidden="true" style={{ order: 81 }}>Library</span>}
      </nav>
      <div className="rail__bot">
        {admin.length > 0 && (
          <nav aria-label="Admin" className="rail__admin">
            <span className="sep" role="separator" />
            <span className="rail__cap label" aria-hidden="true">Admin</span>
            {admin.map((m) => item(m))}
          </nav>
        )}
        {canToggle && (
          <button type="button" className="ri ri--toggle" aria-expanded={open} aria-controls="rail" aria-label={open ? 'Hide labels' : 'Show labels'} onClick={onToggle}
            onPointerEnter={show('Show labels')} onPointerLeave={hide} onFocus={show('Show labels')} onBlur={hide}>
            <Icon name={open ? 'collapse' : 'expand'} /><span className="ri__label" aria-hidden="true">{open ? 'Hide labels' : 'Show labels'}</span>
          </button>
        )}
        <AccountMenu session={session} />
      </div>
      {tip && <span className="tip" aria-hidden="true" style={{ top: tip.y }}>{tip.label}</span>}
    </aside>
  );
}

function AccountMenu({ session }: { session: Session }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); btn.current?.focus(); } };
    document.addEventListener('pointerdown', down);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('pointerdown', down); document.removeEventListener('keydown', key); };
  }, [open]);
  return (
    <div className="acct" ref={wrap} onBlur={(e) => { if (open && !wrap.current?.contains(e.relatedTarget as Node | null) && e.relatedTarget) setOpen(false); }} onKeyDown={(e) => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      const items = Array.from(wrap.current?.querySelectorAll<HTMLElement>('.acct__item') ?? []);
      if (!open) { if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); } return; }
      const i = items.indexOf(document.activeElement as HTMLElement);
      e.preventDefault();
      items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
    }}>
      <button ref={btn} type="button" className="acct__btn" aria-expanded={open} aria-controls="acct-menu" aria-label={`Account, ${session.email}`} onClick={() => setOpen((o) => !o)}>
        <span className="tile tile--me" aria-hidden="true">{initials(session.email)}</span>
        <span className="acct__mail" aria-hidden="true">{session.email}</span>
      </button>
      {open && (
        <div className="pop acct__menu" id="acct-menu">
          <p className="acct__email">{session.email}</p>
          <a className="acct__item" href={WEBSITE} target="_blank" rel="noreferrer"><Icon name="external" />Open brickbot.ro</a>
          <a className="acct__item" href={LINKS} target="_blank" rel="noreferrer"><Icon name="external" />Open links.brickbot.ro</a>
          <button type="button" className="acct__item" onClick={() => void cms.signOut()}><Icon name="signout" />Sign out</button>
        </div>
      )}
    </div>
  );
}

// ───────── phones ─────────

function TopBar({ session, onMenu }: { session: Session; onMenu: () => void }) {
  const { openPalette } = useShell();
  return (
    <header className="topbar">
      <AppLink href="/" className="topbar__mark" aria-label="BrickBot CMS home"><span className="mark" aria-hidden="true" /></AppLink>
      <span className="topbar__space" />
      <button type="button" className="iconbtn" aria-label="Search and jump" onClick={openPalette}><Icon name="search" /></button>
      {hasCms(session.permissions) && <PublishControl />}
      <button type="button" className="iconbtn" aria-label="Open menu" onClick={onMenu}><Icon name="menu" /></button>
    </header>
  );
}

function Sheet({ session, pathname, onClose }: { session: Session; pathname: string; onClose: () => void }) {
  const mods = modulesFor(session.permissions);
  const current = moduleForPath(pathname)?.id;
  const box = useRef<HTMLDivElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const from = useRef<HTMLElement | null>(null);

  useEffect(() => {
    from.current = document.activeElement as HTMLElement | null;
    close.current?.focus();
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      const el = from.current;
      if (el && document.contains(el)) el.focus();
    };
  }, []);

  const key = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
    if (e.key !== 'Tab') return;
    const f = Array.from(box.current?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)') ?? []);
    if (!f.length) return;
    const a = document.activeElement;
    if (e.shiftKey && a === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && a === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  };

  const groups: ModuleGroup[] = ['website', 'links', 'admin'];
  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label="Menu" ref={box} onKeyDown={key}>
      <div className="sheet__head">
        <span className="mark sheet__mark" role="img" aria-label="BrickBot" />
        <button ref={close} type="button" className="iconbtn" aria-label="Close menu" onClick={onClose}><Icon name="close" /></button>
      </div>
      <div className="sheet__body">
        {mods.filter((m) => m.group === 'general').map((m) => (
          <AppLink key={m.id} href={m.path} className="sheet__link" aria-current={m.id === 'home' ? (pathname === '/' ? 'page' : undefined) : current === m.id ? 'page' : undefined} onClick={onClose}><Icon name={m.icon} />{m.label}</AppLink>
        ))}
        {groups.map((g) => {
          const list = mods.filter((m) => m.group === g);
          if (!list.length) return null;
          return (
            <section key={g} aria-label={GROUP_LABEL[g]}>
              <h2 className="label sheet__group">{GROUP_LABEL[g]}</h2>
              {list.map((m) => (
                <AppLink key={m.id} href={m.path} className="sheet__link" aria-current={current === m.id ? 'page' : undefined} onClick={onClose}>
                  <Icon name={m.icon} />{m.label}
                </AppLink>
              ))}
            </section>
          );
        })}
        {hasCms(session.permissions) && <div className="sheet__status"><PublishStatus /></div>}
        <section className="sheet__acct" aria-label="Account">
          <div className="sheet__me"><span className="tile tile--me" aria-hidden="true">{initials(session.email)}</span><span className="sheet__email">{session.email}</span></div>
          <a className="sheet__link" href={WEBSITE} target="_blank" rel="noreferrer"><Icon name="external" />Open brickbot.ro</a>
          <a className="sheet__link" href={LINKS} target="_blank" rel="noreferrer"><Icon name="external" />Open links.brickbot.ro</a>
          <button type="button" className="sheet__link" onClick={() => void cms.signOut()}><Icon name="signout" />Sign out</button>
        </section>
      </div>
    </div>
  );
}
