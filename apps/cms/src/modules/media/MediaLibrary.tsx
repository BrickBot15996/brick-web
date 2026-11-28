import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouterState } from '@tanstack/react-router';
import { cdn, videoPoster } from '../../lib/cdn';
import type { FileKind } from '../../lib/cdn';
import { fileLeaf, folderOf, formatBytes, isVariantBase, mediaApi, mediaKeys, mediaUrl, STORAGE_LIMIT_BYTES, useMediaFiles } from '../../lib/data/media';
import type { MediaFile } from '../../lib/data/media';
import { useUploader } from '../../lib/data/media-upload';
import { editedWhen } from '../../lib/format';
import { WIDE, useMedia } from '../../lib/media';
import { useShell } from '../../lib/shell';
import { Dialog, FilePreview, UploadQueue, UploadZone } from '../../components/edit';
import { PageHeader } from '../../components/PageHeader';
import { Icon } from '../../components/icons';
import { useContentMutation } from '../../lib/data/hooks';
import { buildTree, CANONICAL_FOLDERS, visibleNodes } from './folders';
import { ancestors } from './folders';
import { LIcon } from './icons';

const DOCK = '(min-width: 1280px)';
const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
const KIND_LABEL: Record<FileKind, string> = { image: 'Image', svg: 'SVG', pdf: 'PDF', video: 'Video', other: 'File' };
const extLabel = (f: MediaFile) => (isVariantBase(f.key) ? 'WEBP' : (f.key.split('.').pop() ?? '').toUpperCase());
const dims = (f: MediaFile) => (f.width && f.height ? `${f.width}×${f.height}` : undefined);
/** Logos and marks sit on a dark tile whole; photos fill it. */
const LOGO_FOLDERS = ['brand/', 'sponsors/', 'external/', 'projects/', 'links/'];
const fitOf = (f: MediaFile) => (f.kind === 'image' && !LOGO_FOLDERS.some((p) => f.key.startsWith(p)) ? 'cover' : 'contain');
const absolute = (u: string) => new URL(u, window.location.href).href;
const largest = (f: MediaFile) => (f.widths?.length ? Math.max(...f.widths) : 0);
/** The address the file is served from (the biggest variant for a CMS raster upload). */
const publicUrl = (f: MediaFile) => absolute(isVariantBase(f.key) ? cdn(`${f.key}-${largest(f) || 960}.webp`) : cdn(f.key));
const openUrl = (f: MediaFile) => (isVariantBase(f.key) ? mediaUrl(f.key, 99999) : mediaUrl(f.key));

function useCopy() {
  const [done, setDone] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = async (text: string, id: string) => {
    try { await navigator.clipboard.writeText(text); } catch {
      const t = document.createElement('textarea');
      t.value = text; t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); } finally { t.remove(); }
    }
    setDone(id);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setDone(null), 1600);
  };
  return { done, copy };
}

// ───────── storage meter ─────────

function StorageMeter() {
  const q = useQuery({ queryKey: [...mediaKeys.all, 'storage'], queryFn: () => mediaApi.storage() });
  if (q.isError) return <p className="ml__meter ml__meter--off">Storage use unavailable.</p>;
  const used = q.data?.usedBytes ?? 0;
  const limit = q.data?.limitBytes ?? STORAGE_LIMIT_BYTES;
  const pct = Math.min(100, (used / limit) * 100);
  const text = q.data ? `${formatBytes(used)} of ${formatBytes(limit)} used` : 'Checking storage';
  return (
    <div className="ml__meter">
      <p className="ml__meter-t"><span className="label">Storage</span><span className="tnum" role="status">{text}</span></p>
      <div className="ml__bar" role="meter" aria-label="Storage used" aria-valuemin={0} aria-valuemax={limit} aria-valuenow={used} aria-valuetext={text}>
        <span style={{ width: `${q.data ? Math.max(pct, 0.8) : 0}%` }} />
      </div>
      <p className="ml__meter-n">Free tier: 10 GB. Compress video, and put long videos on YouTube.</p>
    </div>
  );
}

// ───────── delete ─────────

function DeleteDialog({ file, onClose, onDeleted }: { file: MediaFile; onClose: () => void; onDeleted: () => void }) {
  const usage = useQuery({ queryKey: [...mediaKeys.all, 'usage', file.key], queryFn: () => mediaApi.usage(file.key) });
  const del = useContentMutation((k: string) => mediaApi.remove(k), mediaKeys.all);
  const [error, setError] = useState<string | null>(null);
  const go = async () => {
    setError(null);
    try { await del.mutateAsync(file.key); onDeleted(); } catch (e) { setError(e instanceof Error && e.message ? e.message : 'Try again.'); }
  };
  return (
    <Dialog role="alertdialog" title={`Delete ${fileLeaf(file.key)}?`} onClose={() => { if (!del.isPending) onClose(); }} initialFocus="[data-keep]"
      actions={
        <>
          <button type="button" className="btn btn--ghost" data-keep disabled={del.isPending} onClick={onClose}>Keep file</button>
          <button type="button" className="btn btn--primary" disabled={del.isPending} onClick={() => void go()}>
            {del.isPending ? <><span className="spin" aria-hidden="true" />Deleting</> : 'Delete file'}
          </button>
        </>
      }>
      <p>This removes <b>{file.key}</b>{file.widths && file.widths.length > 1 ? ` and its ${file.widths.length} sizes` : ''} from the bucket for good. It can’t be undone.</p>
      {usage.isPending && <p className="dlg__note">Checking where it is used…</p>}
      {usage.isError && <p className="dlg__note">Couldn’t check where it is used. Be sure before you delete.</p>}
      {usage.isSuccess && usage.data.length > 0 && (
        <div>
          <p>It is used by {usage.data.length === 1 ? 'this item' : `these ${usage.data.length} items`}. They will show a missing image until someone picks another file:</p>
          <ul className="ml__uses">{usage.data.map((u) => <li key={u.href + u.label}><a className="link" href={u.href}>{u.label}</a><span>{u.hint}</span></li>)}</ul>
        </div>
      )}
      {usage.isSuccess && usage.data.length === 0 && <p className="dlg__note">Nothing in the CMS is known to use it.</p>}
      {error && <p className="field__error" role="alert">Couldn’t delete it. {error}</p>}
    </Dialog>
  );
}

// ───────── inspector ─────────

function Inspector({ file, onDelete }: { file: MediaFile; onDelete: () => void }) {
  const { session } = useShell();
  const { done, copy } = useCopy();
  const usage = useQuery({ queryKey: [...mediaKeys.all, 'usage', file.key], queryFn: () => mediaApi.usage(file.key) });
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [file.key]);
  const url = publicUrl(file);
  const by = file.uploadedBy ? (file.uploadedBy === session.email ? 'You' : file.uploadedBy) : null;
  const rows: [string, string | undefined][] = [
    ['Kind', `${KIND_LABEL[file.kind]} · ${extLabel(file)}`],
    ['Folder', folderOf(file.key) || 'root'],
    ['Size', formatBytes(file.size)],
    ['Dimensions', dims(file) ? `${dims(file)} px` : undefined],
    ['Stored widths', file.widths?.length ? file.widths.join(' · ') + ' px' : undefined],
    ['Uploaded', file.uploadedAt && by ? `${by}, ${editedWhen(file.uploadedAt)}` : undefined],
  ];
  return (
    <div className="ml__insp">
      <div className="ml__prev" data-kind={file.kind}>
        {file.kind === 'video' ? (
          <video controls preload="metadata" src={mediaUrl(file.key)} poster={file.poster ? mediaUrl(file.poster) : mediaUrl(videoPoster(file.key))} aria-label={`Preview of ${fileLeaf(file.key)}`} />
        ) : file.kind === 'pdf' || broken ? (
          <FilePreview value={file.key} tile="dark" empty="file" />
        ) : (
          <img src={mediaUrl(file.key, 960)} alt="" onError={() => setBroken(true)} />
        )}
      </div>
      <h3 className="ml__iname">{fileLeaf(file.key)}</h3>
      <div className="ml__acts">
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => void copy(file.key, 'key')}><LIcon name="copy" />{done === 'key' ? 'Copied' : 'Copy key'}</button>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => void copy(url, 'url')}><LIcon name="copy" />{done === 'url' ? 'Copied' : 'Copy URL'}</button>
        <a className="btn btn--ghost btn--sm" href={openUrl(file)} target="_blank" rel="noreferrer">Open<Icon name="external" /><span className="sr-only"> (opens in a new tab)</span></a>
        <button type="button" className="btn btn--ghost btn--sm" onClick={onDelete}><Icon name="trash" />Delete</button>
      </div>
      <p className="sr-only" role="status">{done ? 'Copied to the clipboard.' : ''}</p>
      <dl className="ml__dl">
        {rows.filter((r) => r[1]).map(([k, v]) => <div key={k}><dt className="label">{k}</dt><dd>{v}</dd></div>)}
        <div><dt className="label">Key</dt><dd className="ml__code">{file.key}</dd></div>
        <div><dt className="label">URL</dt><dd className="ml__code">{url}</dd></div>
      </dl>
      <div>
        <h4 className="label ml__usedh">Used in</h4>
        {usage.isPending && <p className="ml__muted">Checking…</p>}
        {usage.isError && <p className="ml__muted">Couldn’t check.</p>}
        {usage.isSuccess && usage.data.length === 0 && <p className="ml__muted">Nothing in the CMS is known to use this file.</p>}
        {usage.isSuccess && usage.data.length > 0 && <ul className="ml__uses">{usage.data.map((u) => <li key={u.href + u.label}><a className="link" href={u.href}>{u.label}</a><span>{u.hint}</span></li>)}</ul>}
      </div>
    </div>
  );
}

// ───────── page ─────────

type View = 'grid' | 'list';

export function MediaLibrary() {
  const q = useMediaFiles(['']);
  const search = useRouterState({ select: (s) => s.location.searchStr });
  const wide = useMedia(WIDE);
  const docked = useMedia(DOCK);
  const [folder, setFolder] = useState('');
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<'all' | FileKind>('all');
  const [view, setView] = useState<View>('grid');
  const [selected, setSelected] = useState<string | null>(null);
  const [inspecting, setInspecting] = useState(false);
  const [deleting, setDeleting] = useState<MediaFile | null>(null);
  const [railOpen, setRailOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [target, setTarget] = useState('');
  const [note, setNote] = useState('');
  const { copy } = useCopy();
  useEffect(() => { if (!note) return; const t = setTimeout(() => setNote(''), 2400); return () => clearTimeout(t); }, [note]);

  const all = q.data ?? [];
  const tree = useMemo(() => buildTree(all), [all]);
  const rows = useMemo(() => visibleNodes(tree, open), [tree, open]);

  // ?file=… (from the jump palette): select that file and show its folder.
  const applied = useRef<string | null>(null);
  useEffect(() => {
    const k = new URLSearchParams(search).get('file');
    if (!k || !q.data || applied.current === search) return;
    const f = q.data.find((x) => x.key === k);
    if (!f) return;
    applied.current = search;
    setQuery(''); setKind('all');
    setFolder(folderOf(f.key));
    setOpen((o) => new Set([...o, ...ancestors(folderOf(f.key)).slice(0, -1)]));
    setSelected(f.key); setInspecting(true);
  }, [search, q.data]);

  const uploadTo = folder || target;
  const up = useUploader({ folder: uploadTo, onDone: (f) => setNote(`${fileLeaf(f.key)} uploaded.`) });

  const nq = norm(query.trim());
  const shown = useMemo(() => {
    const inFolder = (f: MediaFile) => (nq ? true : folder === '' ? true : folderOf(f.key) === folder);
    return all
      .filter(inFolder)
      .filter((f) => kind === 'all' || f.kind === kind)
      .filter((f) => !nq || norm(f.key).includes(nq))
      .sort((a, b) => (nq || folder === '' ? a.key.localeCompare(b.key) : fileLeaf(a.key).localeCompare(fileLeaf(b.key))));
  }, [all, folder, kind, nq]);
  const subfolders = useMemo(() => {
    if (nq || folder === '') return [];
    const find = (list: typeof tree): (typeof tree)[number] | undefined => { for (const n of list) { if (n.path === folder) return n; const r = find(n.children); if (r) return r; } };
    return find(tree)?.children ?? [];
  }, [tree, folder, nq]);

  const sel = all.find((f) => f.key === selected) ?? null;
  const filtered = nq !== '' || kind !== 'all';
  const state = q.isPending ? 'loading' : q.isError ? 'error' : all.length === 0 ? 'empty' : shown.length === 0 && subfolders.length === 0 ? (filtered ? 'noresults' : 'folder-empty') : 'ready';

  const pick = (f: MediaFile) => { setSelected(f.key); setInspecting(true); };
  const go = (path: string) => {
    setFolder(path); setQuery(''); setRailOpen(false);
    if (path) setOpen((o) => new Set([...o, ...ancestors(path).slice(0, -1)]));
  };
  const toggle = (p: string) => setOpen((o) => { const n = new Set(o); if (n.has(p)) n.delete(p); else n.add(p); return n; });

  const showUpload = uploadOpen || dragging || up.items.length > 0;
  const folderLabel = folder ? folder.replace(/\/$/, '') : 'All files';
  const count = `${shown.length} ${shown.length === 1 ? 'file' : 'files'}`;

  return (
    <section className="ml" aria-label="Media library">
      <PageHeader
        sub={state === 'ready' || state === 'noresults' ? <span className="tnum" role="status">{`${all.length} files in the bucket`}</span> : undefined}
        actions={<button type="button" className="btn btn--primary btn--sm" aria-expanded={showUpload} onClick={() => setUploadOpen((v) => !v)}><LIcon name="upload" />Upload</button>} />
      <StorageMeter />

      <div className="ml__body" onDragOver={(e) => { if (e.dataTransfer.types.includes('Files')) { e.preventDefault(); setDragging(true); } }} onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false); }} onDrop={() => setDragging(false)}>
        <nav className="ml__rail" aria-label="Folders" data-open={railOpen || undefined}>
          <button type="button" className="ml__railtoggle input" aria-expanded={railOpen} onClick={() => setRailOpen((v) => !v)}>
            <LIcon name="folder" /><span>{folderLabel}</span><Icon name="down" />
          </button>
          <ul className="ml__tree">
            <li><button type="button" className="ml__fold" aria-current={folder === '' ? 'true' : undefined} onClick={() => go('')}><span className="ml__fname">All files</span><span className="ml__fcount tnum">{all.length}</span></button></li>
            {rows.map((n) => (
              <li key={n.path} style={{ ['--depth' as string]: n.depth }}>
                <div className="ml__frow">
                  {n.children.length > 0
                    ? <button type="button" className="ml__chev" aria-expanded={open.has(n.path)} aria-label={`${open.has(n.path) ? 'Collapse' : 'Expand'} ${n.name}`} onClick={() => toggle(n.path)}><LIcon name="chevron" /></button>
                    : <span className="ml__chev" aria-hidden="true" />}
                  <button type="button" className="ml__fold" aria-current={folder === n.path ? 'true' : undefined} onClick={() => go(n.path)}>
                    <span className="ml__fname">{n.name}</span><span className="ml__fcount tnum" data-zero={n.count === 0 || undefined}>{n.count}</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml__main">
          <div className="ml__tools">
            <div className="lp__search">
              <Icon name="search" />
              <input type="search" className="input input--search" aria-label="Search all files by name or key" placeholder="Search all files" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <label className="lp__filter ml__kind"><span className="sr-only">Kind</span>
              <select className="input input--select input--sm" value={kind} onChange={(e) => setKind(e.target.value as 'all' | FileKind)}>
                <option value="all">All kinds</option><option value="image">Images</option><option value="svg">SVG</option><option value="pdf">PDF</option><option value="video">Video</option>
              </select>
            </label>
            <div className="ml__views" role="group" aria-label="Layout">
              <button type="button" className="iconbtn iconbtn--sm" aria-pressed={view === 'grid'} aria-label="Grid" onClick={() => setView('grid')}><LIcon name="grid" /></button>
              <button type="button" className="iconbtn iconbtn--sm" aria-pressed={view === 'list'} aria-label="List" onClick={() => setView('list')}><LIcon name="rows" /></button>
            </div>
          </div>
          <p className="ml__where"><span className="ml__path">{nq ? `Search results` : folderLabel}</span><span className="lp__count tnum" role="status">{state === 'ready' || state === 'noresults' || state === 'folder-empty' ? count : ''}</span></p>

          {showUpload && (
            <div className="ml__upload">
              <UploadZone onFiles={(f) => up.add(f, uploadTo)} disabled={!uploadTo} hint={uploadTo ? <>Goes into <b>{uploadTo.replace(/\/$/, '')}</b>. Images become WebP sizes, video stays under 50 MB.</> : 'Choose a folder first.'}>
                {!folder && (
                  <label className="upl__target"><span className="label">Upload to</span>
                    <select className="input input--select input--sm" value={target} onChange={(e) => setTarget(e.target.value)}>
                      <option value="">Choose a folder</option>
                      {CANONICAL_FOLDERS.filter((p) => !['seasons/', 'gallery/', 'site/', 'links/'].includes(p)).map((p) => <option key={p} value={p}>{p.replace(/\/$/, '')}</option>)}
                    </select>
                  </label>
                )}
              </UploadZone>
              <UploadQueue items={up.items} onRetry={up.retry} onDismiss={up.dismiss} />
              {up.items.some((i) => i.status === 'done') && !up.busy && <button type="button" className="link ml__clear" onClick={up.clearFinished}>Clear finished</button>}
            </div>
          )}
          <p className="ml__flash" role="status" data-on={note ? '' : undefined}>{note}</p>

          {state === 'loading' && <div className="ml__grid" aria-hidden="true">{Array.from({ length: 8 }, (_, i) => <div key={i} className="skeleton ml__skel" style={{ opacity: 1 - i * 0.09 }} />)}</div>}
          {state === 'error' && <div className="notice" role="alert"><span>Couldn’t load the media library.</span><button type="button" className="link" onClick={() => void q.refetch()}>Try again</button></div>}
          {state === 'empty' && <div className="lp__empty"><p className="lp__empty-t">The bucket is empty.</p><p>Upload the first file with the Upload button, or drag it onto this page.</p></div>}
          {state === 'noresults' && <p className="lp__empty">No file matches. Try another name, or clear the kind filter.</p>}
          {state === 'folder-empty' && <p className="lp__empty">No files in {folderLabel} yet. Drag some here, or press Upload.</p>}

          {subfolders.length > 0 && (
            <ul className="ml__subs" aria-label="Folders in this folder">
              {subfolders.map((n) => <li key={n.path}><button type="button" className="ml__sub" onClick={() => go(n.path)}><LIcon name="folder" /><span>{n.name}</span><span className="tnum ml__fcount" data-zero={n.count === 0 || undefined}>{n.count}</span></button></li>)}
            </ul>
          )}

          {state === 'ready' && shown.length > 0 && view === 'grid' && (
            <ul className="ml__grid">
              {shown.map((f) => (
                <li key={f.key}>
                  <button type="button" className="mc" aria-pressed={selected === f.key} onClick={() => pick(f)}>
                    <span className={`mc__tile`} data-fit={fitOf(f)}><FilePreview value={f.key} tile="dark" empty="file" />{f.kind === 'video' && <span className="mc__badge"><LIcon name="play" /></span>}</span>
                    <span className="mc__name">{fileLeaf(f.key)}</span>
                    <span className="mc__meta">{[extLabel(f), dims(f), formatBytes(f.size) === '—' ? undefined : formatBytes(f.size)].filter(Boolean).join(' · ')}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {state === 'ready' && shown.length > 0 && view === 'list' && (
            <div className="ml__tablewrap">
              <table className="ml__table">
                <caption className="sr-only">Files in {folderLabel}</caption>
                <thead><tr><th scope="col">Name</th><th scope="col">Kind</th><th scope="col" className="ml__num">Size</th><th scope="col" className="ml__sec">Dimensions</th><th scope="col" className="ml__sec">Widths</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
                <tbody>
                  {shown.map((f) => (
                    <tr key={f.key} data-selected={selected === f.key || undefined}>
                      <td>
                        <button type="button" className="ml__rowbtn" aria-pressed={selected === f.key} onClick={() => pick(f)}>
                          <span className="mc__tile mc__tile--sm" data-fit={fitOf(f)}><FilePreview value={f.key} tile="dark" empty="file" /></span>
                          <span className="ml__rname"><span>{fileLeaf(f.key)}</span>{(nq || !folder) && <span className="ml__rdir">{folderOf(f.key) || 'root'}</span>}</span>
                        </button>
                      </td>
                      <td>{KIND_LABEL[f.kind]}</td>
                      <td className="ml__num tnum">{formatBytes(f.size)}</td>
                      <td className="ml__sec tnum">{dims(f) ?? '—'}</td>
                      <td className="ml__sec tnum">{f.widths?.length ? f.widths.join(' · ') : '—'}</td>
                      <td>
                        <span className="ml__ract">
                          <button type="button" className="iconbtn iconbtn--sm" aria-label={`Copy key of ${fileLeaf(f.key)}`} onClick={() => { void copy(f.key, `k:${f.key}`); setNote('Key copied.'); }}><LIcon name="copy" /></button>
                          <button type="button" className="iconbtn iconbtn--sm" aria-label={`Copy URL of ${fileLeaf(f.key)}`} onClick={() => { void copy(publicUrl(f), `u:${f.key}`); setNote('URL copied.'); }}><Icon name="link" /></button>
                          <a className="iconbtn iconbtn--sm" href={openUrl(f)} target="_blank" rel="noreferrer" aria-label={`Open ${fileLeaf(f.key)} in a new tab`}><Icon name="external" /></a>
                          <button type="button" className="iconbtn iconbtn--sm" aria-label={`Delete ${fileLeaf(f.key)}`} onClick={() => setDeleting(f)}><Icon name="trash" /></button>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {docked && wide && (
          <aside className="ml__side" aria-label="File details">
            {sel ? <Inspector file={sel} onDelete={() => setDeleting(sel)} /> : <p className="ml__muted ml__sidehint">Pick a file to see its key, sizes and where it is used.</p>}
          </aside>
        )}
      </div>

      {!(docked && wide) && inspecting && sel && (
        <Dialog wide title={fileLeaf(sel.key)} onClose={() => setInspecting(false)} actions={<button type="button" className="btn btn--ghost" onClick={() => setInspecting(false)}>Close</button>}>
          <Inspector file={sel} onDelete={() => { setInspecting(false); setDeleting(sel); }} />
        </Dialog>
      )}
      {deleting && <DeleteDialog file={deleting} onClose={() => setDeleting(null)} onDeleted={() => { if (selected === deleting.key) setSelected(null); setDeleting(null); }} />}
    </section>
  );
}
