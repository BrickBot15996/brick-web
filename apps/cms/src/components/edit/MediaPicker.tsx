import { useState } from 'react';
import type { FileKind } from '../../lib/cdn';
import { fileLeaf, useMediaFiles } from '../../lib/data/media';
import { acceptedWords, useUploader } from '../../lib/data/media-upload';
import { FilePreview } from './FilePreview';
import { Dialog } from './Dialog';
import { UploadQueue, UploadZone } from './UploadZone';

/**
 * Pick a file from the media library, optionally only of some kinds (images, a PDF, a video), or upload a new one into
 * one of the folders (raster images are resized to WebP variants in the browser; the new file is selected when done).
 */
export function MediaPicker({ prefixes, kinds, current, tile, onPick, onClose }: {
  prefixes: string[];
  /** Only these kinds of file; undefined lists everything. */
  kinds?: FileKind[];
  current: string | null;
  tile: 'light' | 'dark';
  onPick: (key: string) => void;
  onClose: () => void;
}) {
  const files = useMediaFiles(prefixes, kinds);
  const [chosen, setChosen] = useState<string | null>(current);
  const folders = prefixes.map((p) => p.replace(/\/$/, '')).join(', ');
  const [target, setTarget] = useState(prefixes[0]);
  const up = useUploader({ folder: target, allow: kinds, onDone: (f) => setChosen(f.key) });
  const empty = files.isSuccess && files.data.length === 0;

  return (
    <Dialog
      wide
      title="Choose from media library"
      onClose={onClose}
      initialFocus="input:checked, input[type=radio]"
      actions={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn--primary" disabled={!chosen || up.busy} onClick={() => chosen && onPick(chosen)}>Use this file</button>
        </>
      }
    >
      <p className="dlg__note">Showing {kinds ? `${acceptedWords(kinds)} ` : 'files '}in {folders}.</p>
      <UploadZone
        kinds={kinds}
        onFiles={(f) => up.add(f)}
        buttonLabel="Upload new"
        hint={<>Goes into <b>{target.replace(/\/$/, '')}</b>. Images are resized to WebP in your browser first.</>}
      >
        {prefixes.length > 1 && (
          <label className="upl__target"><span className="label">Upload to</span>
            <select className="input input--select input--sm" value={target} onChange={(e) => setTarget(e.target.value)}>
              {prefixes.map((p) => <option key={p} value={p}>{p.replace(/\/$/, '')}</option>)}
            </select>
          </label>
        )}
      </UploadZone>
      <UploadQueue items={up.items} onRetry={up.retry} onDismiss={up.dismiss} />
      {files.isPending && <div className="mp__grid" aria-hidden="true">{[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton mp__skel" />)}</div>}
      {files.isError && <p className="notice" role="alert">Couldn’t load the files. <button type="button" className="link" onClick={() => void files.refetch()}>Try again</button></p>}
      {empty && <p className="empty">No files in {folders} yet. Upload one above.</p>}
      {files.isSuccess && files.data.length > 0 && (
        <fieldset className="mp">
          <legend className="sr-only">Files</legend>
          <div className="mp__grid">
            {files.data.map(({ key: k }) => (
              <label key={k} className="mp__opt">
                <input type="radio" name="media" className="sr-only" checked={chosen === k} onChange={() => setChosen(k)} onDoubleClick={() => onPick(k)} />
                <span className={`mp__tile mp__tile--${tile}`}><FilePreview value={k} tile={tile} /></span>
                <span className="mp__name">{fileLeaf(k)}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
    </Dialog>
  );
}
