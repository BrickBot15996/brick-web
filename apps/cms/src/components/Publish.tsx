import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { usePublish, usePublishStatus } from '../lib/data/hooks';
import { cms } from '../lib/data';
import type { PublishTarget } from '../lib/data';
import { can, hasCms } from '../lib/modules';
import { elapsed, publishedWhen } from '../lib/format';
import { useShell } from '../lib/shell';
import { Icon } from './icons';

const TARGETS: { id: PublishTarget; label: string; site: string; needs: 'cms.website' | 'cms.links' }[] = [
  { id: 'website', label: 'Website', site: 'brickbot.ro', needs: 'cms.website' },
  { id: 'links', label: 'Links', site: 'links.brickbot.ro', needs: 'cms.links' },
];

function useElapsed(startedAt: string | null, active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active, startedAt]);
  return startedAt ? Math.max(0, Math.round((now - new Date(startedAt).getTime()) / 1000)) : 0;
}

/** Closes a popover on outside press and Escape, and keeps focus sensible. Shared by the info note and the Publish popover. */
function useDismiss(open: boolean, close: () => void, wrap: React.RefObject<HTMLElement | null>, back: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => { if (!wrap.current?.contains(e.target as Node)) close(); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { close(); back.current?.focus(); } };
    document.addEventListener('pointerdown', down);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('pointerdown', down); document.removeEventListener('keydown', key); };
  }, [open, close, wrap, back]);
}

/**
 * The quiet header state while the client can't publish yet (live, before the website reads from the CMS): no yellow
 * button, just the honest status and an info note. The jump palette's "Publish…" action opens the same note.
 */
function PublishOff() {
  const { publishOpen, setPublishOpen } = useShell();
  const wrap = useRef<HTMLSpanElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const id = useId();
  const close = () => setPublishOpen(false);
  useDismiss(publishOpen, close, wrap, btn);
  return (
    <span className="pstat pstat--off" role="status" ref={wrap}>
      <span className="led led--idle" aria-hidden="true" />
      <b>Saved</b>
      <span className="pstat__when">· publishing not connected yet</span>
      <span className="pubinfo">
        <button ref={btn} type="button" className="pubinfo__btn" aria-expanded={publishOpen} aria-controls={id} aria-label="About publishing" onClick={() => setPublishOpen(!publishOpen)}>
          <svg viewBox="0 0 24 24" className="i" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5" /><path d="M12 11v5.5M12 7.5h.01" /></svg>
        </button>
        {publishOpen && (
          <div className="pop" id={id} role="group" aria-label="About publishing">
            <p className="pop__title">Publishing isn’t connected yet</p>
            <p className="pop__note">Everything you save is stored safely in the team’s database. It goes live on the website once the website reads from the CMS. Until then there is nothing to publish, and this button stays away.</p>
          </div>
        )}
      </span>
    </span>
  );
}

/** "Live · published yesterday 18:42", "Building… 0:12" or "Publish failed · Try again". */
export function PublishStatus() {
  return cms.canPublish ? <PublishState /> : <PublishOff />;
}

function PublishState() {
  const { session } = useShell();
  const status = usePublishStatus();
  const publish = usePublish();
  const s = status.data;
  const sec = useElapsed(s?.startedAt ?? null, s?.state === 'building');
  if (!s) return <span className="pstat pstat--idle" aria-hidden="true" />;

  if (s.state === 'building') {
    return (
      <span className="pstat" role="status">
        <span className="led led--busy" aria-hidden="true" />
        <b>Building…</b>
        <span className="tnum" aria-hidden="true">{elapsed(sec)}</span>
        <span className="sr-only">Publishing, usually 1 to 2 minutes</span>
      </span>
    );
  }
  if (s.state === 'failed') {
    return (
      <span className="pstat pstat--failed" role="status">
        <Icon name="alert" />
        <b>Publish failed</b>
        {hasCms(session.permissions) && (
          <button type="button" className="link" onClick={() => publish.mutate(s.targets)}>Try again</button>
        )}
      </span>
    );
  }
  const waiting = s.waiting.website + s.waiting.links;
  if (waiting > 0) {
    return (
      <span className="pstat" role="status">
        <span className="led led--dirty" aria-hidden="true" />
        <b className="tnum">{waiting} {waiting === 1 ? 'change' : 'changes'} waiting</b>
        <span className="pstat__when">· {s.lastPublishedAt ? `live since ${publishedWhen(s.lastPublishedAt)}` : 'never published'}</span>
      </span>
    );
  }
  return (
    <span className="pstat" role="status">
      <span className="led" aria-hidden="true" />
      <b>Live</b>
      <span className="pstat__when">· {s.lastPublishedAt ? `published ${publishedWhen(s.lastPublishedAt)}` : 'never published'}</span>
    </span>
  );
}

/** The Publish button and its popover (not a modal): pick what goes live, then go. Absent while publishing isn't available. */
export function PublishControl() {
  return cms.canPublish ? <PublishPopover /> : null;
}

function PublishPopover() {
  const { session, publishOpen, setPublishOpen } = useShell();
  const status = usePublishStatus();
  const publish = usePublish();
  const available = TARGETS.filter((t) => can(session.permissions, t.needs));
  const [picked, setPicked] = useState<PublishTarget[]>(() => available.map((t) => t.id));
  const wrap = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const first = useRef<HTMLInputElement>(null);
  const id = useId();
  const busy = status.data?.state === 'building' || publish.isPending;

  useEffect(() => { if (publishOpen) first.current?.focus(); }, [publishOpen]);
  const close = useCallback(() => setPublishOpen(false), [setPublishOpen]);
  useDismiss(publishOpen, close, wrap, btn);

  if (available.length === 0) return null;
  const waiting = status.data?.waiting;
  const count = (t: PublishTarget) => { const n = waiting?.[t] ?? 0; return n === 0 ? 'up to date' : `${n} ${n === 1 ? 'change' : 'changes'} waiting`; };

  // The popover stays open until the request has been accepted, so a failure is read where it happened.
  const go = () => publish.mutate(picked, { onSuccess: () => setPublishOpen(false) });
  const error = publish.isError ? (publish.error instanceof Error && publish.error.message ? publish.error.message : 'Try again.') : null;

  return (
    <div className="pubctl" ref={wrap} onBlur={(e) => { if (publishOpen && e.relatedTarget && !wrap.current?.contains(e.relatedTarget as Node)) setPublishOpen(false); }}>
      <button ref={btn} type="button" className="btn btn--primary" aria-expanded={publishOpen} aria-controls={id} disabled={busy} onClick={() => { publish.reset(); setPublishOpen(!publishOpen); }}>
        <Icon name="bolt" />
        Publish
      </button>
      {publishOpen && (
        <div className="pop" id={id} role="group" aria-label="Publish">
          <p className="pop__title">What goes live</p>
          {available.map((t, i) => (
            <label key={t.id} className="pop__opt">
              <input
                ref={i === 0 ? first : undefined}
                type="checkbox"
                checked={picked.includes(t.id)}
                onChange={(e) => setPicked((p) => (e.target.checked ? [...p, t.id] : p.filter((x) => x !== t.id)))}
              />
              <span className="pop__txt"><b>{t.label}</b> <span className="pop__site">{t.site}</span></span>
              <span className="pop__count tnum">{count(t.id)}</span>
            </label>
          ))}
          <p className="pop__note">Saved changes go live in about 1–2 minutes.</p>
          {error && <p className="pop__err" role="alert"><Icon name="alert" /><span>Couldn’t publish. {error}</span></p>}
          <button type="button" className="btn btn--primary pop__go" disabled={picked.length === 0 || publish.isPending} onClick={go}>
            {publish.isPending ? <><span className="spin" aria-hidden="true" />Publishing</> : error ? 'Try again' : 'Publish now'}
          </button>
        </div>
      )}
    </div>
  );
}
