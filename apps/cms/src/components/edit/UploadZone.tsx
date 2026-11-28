import { useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { FileKind } from '../../lib/cdn';
import { formatBytes } from '../../lib/data/media';
import type { UploadItem } from '../../lib/data/media-upload';
import { Icon } from '../icons';

const ACCEPT: Record<FileKind, string> = {
  image: 'image/png,image/jpeg,image/webp,image/gif,image/avif', svg: '.svg,image/svg+xml', pdf: '.pdf,application/pdf', video: '.mp4,video/mp4', other: '',
};
/** The `accept` string for a file chooser limited to these kinds (everything the library takes when undefined). */
export const acceptFor = (kinds?: FileKind[]) => (kinds ?? ['image', 'svg', 'pdf', 'video']).map((k) => ACCEPT[k]).filter(Boolean).join(',');

/** A drop area plus a Choose files button. Hands the files to `onFiles`; the caller owns the upload (see useUploader). */
export function UploadZone({ onFiles, kinds, hint, disabled, buttonLabel = 'Choose files', children }: {
  onFiles: (files: File[]) => void;
  kinds?: FileKind[];
  hint?: ReactNode;
  disabled?: boolean;
  buttonLabel?: string;
  /** Extra controls inside the zone, e.g. a target-folder select. */
  children?: ReactNode;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const id = useId();
  const take = (list: FileList | null) => { if (list && list.length) onFiles(Array.from(list)); };
  return (
    <div
      className="upl__zone"
      data-over={over || undefined}
      onDragOver={(e) => { if (disabled) return; e.preventDefault(); setOver(true); }}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(false); }}
      onDrop={(e) => { e.preventDefault(); setOver(false); if (!disabled) take(e.dataTransfer.files); }}
    >
      <div className="upl__text">
        <p className="upl__t" id={`${id}-t`}>{over ? 'Drop to upload' : 'Drag files here'}</p>
        {hint && <p className="upl__hint">{hint}</p>}
      </div>
      {children}
      <input ref={input} type="file" multiple accept={acceptFor(kinds)} className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => { take(e.target.files); e.target.value = ''; }} />
      <button type="button" className="btn btn--ghost btn--sm" disabled={disabled} aria-describedby={`${id}-t`} onClick={() => input.current?.click()}><Icon name="plus" />{buttonLabel}</button>
    </div>
  );
}

const STATUS: Record<UploadItem['status'], string> = { queued: 'Waiting', preparing: 'Resizing', uploading: 'Uploading', done: 'Uploaded', error: 'Failed' };

/** Per-file progress, success and failure for a useUploader queue. */
export function UploadQueue({ items, onRetry, onDismiss }: { items: UploadItem[]; onRetry: (id: string) => void; onDismiss: (id: string) => void }) {
  if (!items.length) return null;
  const failed = items.filter((i) => i.status === 'error').length;
  const done = items.filter((i) => i.status === 'done').length;
  return (
    <>
      <p className="sr-only" role="status">{done} of {items.length} uploaded{failed ? `, ${failed} failed` : ''}.</p>
      <ul className="upl__list" aria-label="Uploads">
        {items.map((it) => (
          <li key={it.id} className="upl__row" data-status={it.status}>
            <span className="upl__ico" aria-hidden="true"><Icon name={it.status === 'done' ? 'check' : it.status === 'error' ? 'alert' : 'file'} /></span>
            <div className="upl__main">
              <p className="upl__name"><span>{it.name}</span><span className="upl__size tnum">{formatBytes(it.size)}</span></p>
              {(it.status === 'preparing' || it.status === 'uploading' || it.status === 'queued') && (
                <div className="upl__bar" role="progressbar" aria-label={`${it.name}: ${STATUS[it.status]}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={it.status === 'uploading' ? Math.round(it.progress * 100) : undefined}>
                  <span style={{ width: it.status === 'uploading' ? `${Math.round(it.progress * 100)}%` : undefined }} data-indeterminate={it.status !== 'uploading' || undefined} />
                </div>
              )}
              <p className="upl__state" data-error={it.status === 'error' || undefined}>
                {it.status === 'error' ? it.error : it.status === 'done' ? `Uploaded to ${it.folder || 'the root'}` : STATUS[it.status]}
              </p>
            </div>
            {it.status === 'error' && it.retriable !== false && <button type="button" className="link upl__act" onClick={() => onRetry(it.id)}>Retry<span className="sr-only"> {it.name}</span></button>}
            {it.status === 'error' && it.retriable === false && <button type="button" className="link upl__act" onClick={() => onDismiss(it.id)}>Remove<span className="sr-only"> {it.name}</span></button>}
            {(it.status === 'done' || (it.status === 'error' && it.retriable !== false)) && <button type="button" className="iconbtn iconbtn--sm" aria-label={`Dismiss ${it.name}`} onClick={() => onDismiss(it.id)}><Icon name="close" /></button>}
          </li>
        ))}
      </ul>
    </>
  );
}
