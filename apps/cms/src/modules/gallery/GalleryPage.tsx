import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Outlet, useRouter, useRouterState } from '@tanstack/react-router';
import { useBulkGallery, useCreateGalleryItem, useCreateGalleryItems, useDeleteGalleryItems, useGallery } from './data/hooks';
import type { GalleryInput } from './data/types';
import { itemLabel } from './data/preview';
import { useSeasons } from '../../lib/data/hooks';
import { useUploader } from '../../lib/data/media-upload';
import { dateLabel } from './dates';
import { AppLink } from '../../components/AppLink';
import { Icon } from '../../components/icons';
import { Dialog, EditorEmpty, UploadQueue, UploadZone } from '../../components/edit';
import { PageHeader } from '../../components/PageHeader';
import { Tag } from '../../components/Tag';
import { LIcon } from '../media/icons';
import { GalleryThumb } from './GalleryThumb';
import { parseYouTube, ytThumb } from './youtube';

const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
const BASE = '/gallery';
const KIND_WORD = { photo: 'Photo', video: 'Clip', youtube: 'YouTube' } as const;

interface Actions { upload: () => void; youtube: () => void }
const ActionsCtx = createContext<Actions>({ upload: () => {}, youtube: () => {} });

function useSeasonOptions() {
  const seasons = useSeasons().data ?? [];
  return { seasons, label: (id: string | null) => (id ? (seasons.find((s) => s.id === id)?.years ? `${seasons.find((s) => s.id === id)!.game}` : id) : 'General') };
}

// ───────── dialogs ─────────

function SeasonSelect({ value, onChange, label = 'Season' }: { value: string; onChange: (v: string) => void; label?: string }) {
  const { seasons } = useSeasonOptions();
  return (
    <label className="upl__target"><span className="label">{label}</span>
      <select className="input input--select input--sm" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="general">General (no season)</option>
        {seasons.map((s) => <option key={s.id} value={s.id}>{s.game} {s.years}</option>)}
      </select>
    </label>
  );
}

function UploadDialog({ initialSeason, onClose }: { initialSeason: string; onClose: () => void }) {
  const [season, setSeason] = useState(initialSeason);
  const create = useCreateGalleryItems();
  const [added, setAdded] = useState(0);
  const up = useUploader({
    folder: `gallery/${season}/`, allow: ['image', 'video'],
    onDone: (f, it) => {
      const s = it.folder.split('/')[1];
      const input: GalleryInput = {
        kind: f.kind === 'video' ? 'video' : 'photo', key: f.key, youtubeId: null, width: f.width ?? 0, height: f.height ?? 0,
        season: s === 'general' ? null : s, date: null, featured: false, alt: { en: '', ro: '' }, caption: { en: '', ro: '' },
      };
      create.mutateAsync([input]).then(() => setAdded((n) => n + 1), () => undefined);
    },
  });
  return (
    <Dialog wide title="Upload to the gallery" onClose={onClose} actions={<button type="button" className="btn btn--primary" disabled={up.busy} onClick={onClose}>Done</button>}>
      <p className="dlg__note">Photos are resized to WebP and clips stay under 50 MB. Each file becomes a gallery item you can caption afterwards.</p>
      <UploadZone kinds={['image', 'video']} onFiles={(f) => up.add(f, `gallery/${season}/`)} hint={<>Goes into <b>gallery/{season}</b>.</>}>
        <SeasonSelect value={season} onChange={setSeason} />
      </UploadZone>
      <UploadQueue items={up.items} onRetry={up.retry} onDismiss={up.dismiss} />
      {added > 0 && <p role="status" className="gal__added">{added} {added === 1 ? 'item' : 'items'} added to the gallery.</p>}
      {create.isError && <p className="field__error" role="alert">Couldn’t add an item. {create.error instanceof Error ? create.error.message : ''}</p>}
    </Dialog>
  );
}

function YouTubeDialog({ initialSeason, taken, onClose }: { initialSeason: string; taken: string[]; onClose: () => void }) {
  const router = useRouter();
  const create = useCreateGalleryItem();
  const [url, setUrl] = useState('');
  const [season, setSeason] = useState(initialSeason);
  const [show, setShow] = useState(false);
  const id = parseYouTube(url);
  const error = !show || !url.trim() && !show ? null : !id ? 'Paste a YouTube link, like https://youtu.be/… or https://www.youtube.com/watch?v=…' : taken.includes(id) ? 'This video is already in the gallery.' : null;
  const submit = async () => {
    setShow(true);
    if (!id || taken.includes(id)) return;
    try {
      const it = await create.mutateAsync({ kind: 'youtube', key: null, youtubeId: id, width: 1280, height: 720, season: season === 'general' ? null : season, date: null, featured: false, alt: { en: '', ro: '' }, caption: { en: '', ro: '' } });
      onClose();
      router.history.push(`${BASE}/${it.id}`);
    } catch { /* shown below */ }
  };
  return (
    <Dialog title="Add a YouTube video" onClose={onClose} initialFocus="input"
      actions={<><button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button><button type="button" className="btn btn--primary" disabled={create.isPending} onClick={() => void submit()}>{create.isPending ? <><span className="spin" aria-hidden="true" />Adding</> : 'Add video'}</button></>}>
      <form onSubmit={(e) => { e.preventDefault(); void submit(); }} noValidate className="gal__yt">
        <label className="field"><span className="field__label">YouTube link</span>
          <input className="input" type="url" value={url} placeholder="https://youtu.be/…" aria-invalid={error ? true : undefined} aria-describedby="yt-err" onChange={(e) => setUrl(e.target.value)} onBlur={() => url.trim() && setShow(true)} />
          {error && <span id="yt-err" className="field__error">{error}</span>}
        </label>
        {id && !error && <div className="gal__ytprev"><img src={ytThumb(id)} alt="" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} /><p>Video id <b>{id}</b></p></div>}
        <SeasonSelect value={season} onChange={setSeason} />
        {create.isError && <p className="field__error" role="alert">Couldn’t add it. {create.error instanceof Error ? create.error.message : ''}</p>}
      </form>
    </Dialog>
  );
}

// ───────── layout and grid ─────────

export function GalleryLayout() {
  const q = useGallery();
  const { seasons } = useSeasonOptions();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const selectedId = pathname.startsWith(`${BASE}/`) ? decodeURIComponent(pathname.slice(BASE.length + 1).replace(/\/$/, '')) : null;
  const [query, setQuery] = useState('');
  const [season, setSeason] = useState('all');
  const [kind, setKind] = useState('all');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [dialog, setDialog] = useState<'upload' | 'youtube' | 'delete' | null>(null);
  const [bulkSeason, setBulkSeason] = useState('');
  const [note, setNote] = useState('');
  const bulk = useBulkGallery();
  const delMany = useDeleteGalleryItems();
  const [error, setError] = useState<string | null>(null);

  const all = q.data ?? [];
  const shown = useMemo(() => {
    const n = norm(query.trim());
    return all.filter((i) => (season === 'all' || (season === 'general' ? i.season === null : i.season === season)) && (kind === 'all' || i.kind === kind) && (!featuredOnly || i.featured)
      && (!n || norm(`${i.caption.en} ${i.caption.ro} ${i.alt.en} ${i.key ?? ''}`).includes(n)));
  }, [all, query, season, kind, featuredOnly]);
  const ids = useMemo(() => new Set(all.map((i) => i.id)), [all]);
  const sel = [...picked].filter((id) => ids.has(id));
  const state = q.isPending ? 'loading' : q.isError ? 'error' : all.length === 0 ? 'empty' : shown.length === 0 ? 'noresults' : 'ready';
  const filtered = season !== 'all' || kind !== 'all' || featuredOnly || query.trim() !== '';
  const uploadSeason = season === 'all' ? 'general' : season;

  useEffect(() => { if (!note) return; const t = setTimeout(() => setNote(''), 3000); return () => clearTimeout(t); }, [note]);

  const toggle = (id: string) => setPicked((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const run = async (fn: () => Promise<unknown>, done: string) => {
    setError(null);
    try { await fn(); setNote(done); } catch (e) { setError(e instanceof Error && e.message ? e.message : 'Try again.'); }
  };
  const actions: Actions = { upload: () => setDialog('upload'), youtube: () => setDialog('youtube') };
  const seasonName = (id: string | null) => (id ? seasons.find((s) => s.id === id)?.years ?? id : 'General');

  return (
    <ActionsCtx.Provider value={actions}>
      <div className="gal" data-view={selectedId ? 'detail' : 'list'}>
        <section className="gal__main" aria-label="Gallery items">
          <PageHeader
            sub={state === 'ready' || state === 'noresults' ? <span className="tnum" role="status">{`${shown.length} of ${all.length} ${all.length === 1 ? 'item' : 'items'}`}</span> : undefined}
            actions={<>
              <button type="button" className="btn btn--ghost btn--sm" onClick={actions.youtube}><LIcon name="youtube" />YouTube</button>
              <button type="button" className="btn btn--primary btn--sm" onClick={actions.upload}><LIcon name="upload" />Upload</button>
            </>} />

          <div className="gal__tools">
            <div className="lp__search">
              <Icon name="search" />
              <input type="search" className="input input--search" aria-label="Search captions" placeholder="Search captions" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div className="gal__filters">
              <label className="lp__filter"><span className="label">Season</span>
                <select className="input input--select input--sm" value={season} onChange={(e) => setSeason(e.target.value)}>
                  <option value="all">All seasons</option><option value="general">General</option>
                  {seasons.map((s) => <option key={s.id} value={s.id}>{s.game} {s.years}</option>)}
                </select>
              </label>
              <label className="lp__filter"><span className="label">Kind</span>
                <select className="input input--select input--sm" value={kind} onChange={(e) => setKind(e.target.value)}>
                  <option value="all">All kinds</option><option value="photo">Photos</option><option value="video">Clips</option><option value="youtube">YouTube</option>
                </select>
              </label>
              <button type="button" className="gal__chip btn btn--ghost btn--sm" aria-pressed={featuredOnly} onClick={() => setFeaturedOnly((v) => !v)}>Featured only</button>
            </div>
          </div>

          {sel.length > 0 && (
            <div className="gal__bulk" role="region" aria-label="Bulk actions">
              <p className="gal__bn tnum">{sel.length} selected</p>
              <div className="gal__bs">
                <label className="sr-only" htmlFor="bulk-season">Season for selected items</label>
                <select id="bulk-season" className="input input--select input--sm" value={bulkSeason} onChange={(e) => setBulkSeason(e.target.value)}>
                  <option value="">Set season…</option><option value="general">General (no season)</option>
                  {seasons.map((s) => <option key={s.id} value={s.id}>{s.game} {s.years}</option>)}
                </select>
                <button type="button" className="btn btn--ghost btn--sm" disabled={!bulkSeason || bulk.isPending} onClick={() => void run(async () => { await bulk.mutateAsync({ ids: sel, patch: { season: bulkSeason === 'general' ? null : bulkSeason } }); setBulkSeason(''); }, `Season set for ${sel.length} items.`)}>Apply</button>
              </div>
              <button type="button" className="btn btn--ghost btn--sm" disabled={bulk.isPending} onClick={() => void run(() => bulk.mutateAsync({ ids: sel, patch: { featured: true } }), `${sel.length} items featured.`)}>Feature</button>
              <button type="button" className="btn btn--ghost btn--sm" disabled={bulk.isPending} onClick={() => void run(() => bulk.mutateAsync({ ids: sel, patch: { featured: false } }), `${sel.length} items unfeatured.`)}>Unfeature</button>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setDialog('delete')}><Icon name="trash" />Delete</button>
              <span className="gal__bsp" />
              <button type="button" className="link" onClick={() => setPicked(new Set(shown.map((i) => i.id)))}>Select all {shown.length}</button>
              <button type="button" className="link" onClick={() => setPicked(new Set())}>Clear</button>
            </div>
          )}
          {error && <p className="notice" role="alert">Couldn’t change the items. {error}</p>}
          <p className="gal__flash" role="status">{note}</p>

          {state === 'loading' && <div className="gal__grid" aria-hidden="true">{Array.from({ length: 8 }, (_, i) => <div key={i} className="skeleton gal__skel" style={{ opacity: 1 - i * 0.09 }} />)}</div>}
          {state === 'error' && <div className="notice" role="alert"><span>Couldn’t load the gallery.</span><button type="button" className="link" onClick={() => void q.refetch()}>Try again</button></div>}
          {state === 'empty' && <div className="lp__empty"><p className="lp__empty-t">The gallery is empty.</p><p>Upload photos and clips, or add a YouTube video. They show on the Gallery page after the next Publish.</p></div>}
          {state === 'noresults' && <div className="lp__empty"><p>{filtered ? 'No item matches these filters.' : 'No items.'}</p><button type="button" className="link" onClick={() => { setQuery(''); setSeason('all'); setKind('all'); setFeaturedOnly(false); }}>Clear filters</button></div>}

          {state === 'ready' && (
            <ul className="gal__grid">
              {shown.map((i) => {
                const label = itemLabel(i);
                const on = picked.has(i.id);
                return (
                  <li key={i.id} className="gt" data-picked={on || undefined}>
                    <AppLink href={`${BASE}/${i.id}`} className="gt__link" aria-current={selectedId === i.id ? 'page' : undefined}>
                      <span className="gt__tile"><GalleryThumb item={i} />{i.featured && <Tag lit className="gt__chip">Featured</Tag>}</span>
                      <span className="gt__cap">{label}</span>
                      <span className="gt__meta">{[KIND_WORD[i.kind], seasonName(i.season), i.date ? dateLabel(i.date) : null].filter(Boolean).join(' · ')}{!i.alt.en.trim() && i.kind !== 'youtube' ? ' · No alt text' : ''}</span>
                    </AppLink>
                    <label className="gt__check"><input type="checkbox" className="sr-only" checked={on} onChange={() => toggle(i.id)} /><span className="gt__box" aria-hidden="true"><Icon name="check" /></span><span className="sr-only">Select {label}</span></label>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        <div className="gal__side"><Outlet /></div>
      </div>

      {dialog === 'upload' && <UploadDialog initialSeason={uploadSeason} onClose={() => setDialog(null)} />}
      {dialog === 'youtube' && <YouTubeDialog initialSeason={uploadSeason} taken={all.flatMap((i) => (i.youtubeId ? [i.youtubeId] : []))} onClose={() => setDialog(null)} />}
      {dialog === 'delete' && (
        <Dialog role="alertdialog" title={`Delete ${sel.length} ${sel.length === 1 ? 'item' : 'items'}?`} onClose={() => setDialog(null)} initialFocus="[data-keep]"
          actions={<><button type="button" className="btn btn--ghost" data-keep onClick={() => setDialog(null)}>Keep items</button>
            <button type="button" className="btn btn--primary" disabled={delMany.isPending} onClick={() => void run(async () => { await delMany.mutateAsync(sel); setPicked(new Set()); setDialog(null); }, 'Items deleted.')}>{delMany.isPending ? <><span className="spin" aria-hidden="true" />Deleting</> : 'Delete items'}</button></>}>
          <p>They leave the Gallery page on the next Publish. The files stay in the Media library. It can’t be undone.</p>
        </Dialog>
      )}
    </ActionsCtx.Provider>
  );
}

export function GalleryIndex() {
  const a = useContext(ActionsCtx);
  return <EditorEmpty text="Pick an item to edit its caption, season and date." action={<button type="button" className="btn btn--primary" onClick={a.upload}><LIcon name="upload" />Upload photos</button>} />;
}
