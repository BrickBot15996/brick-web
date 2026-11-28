import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { FileKind } from '../../lib/cdn';
import { getPath, useForm } from '../../lib/form';
import { fid } from './field-base';
import { FilePreview } from './FilePreview';
import { MediaPicker } from './MediaPicker';

/** What a FileField accepts: a raster image or SVG ("image"), only SVG, a PDF, a video, or anything. */
export type FileFieldKind = 'image' | 'svg' | 'pdf' | 'video' | 'any';

/** The kinds of CDN files each field kind lets through. "image" takes rasters and SVG (logos are often SVG). */
export const KIND_FILTER: Record<FileFieldKind, FileKind[] | undefined> = {
  image: ['image', 'svg'], svg: ['svg'], pdf: ['pdf'], video: ['video'], any: undefined,
};
const CHOOSE: Record<FileFieldKind, string> = {
  image: 'Choose from media library', svg: 'Choose an SVG from media library', pdf: 'Choose a PDF from media library', video: 'Choose a video from media library', any: 'Choose a file from media library',
};

/**
 * The current file from the CDN plus a way to pick another, filtered by `kind`. `tile` is the ground an image is shown
 * on (logos for white grounds sit on light). The value is the CDN key (or null). ImageField is this with kind "image".
 */
export function FileField({ name, label, hint, folders, kind = 'any', tile = 'dark', optional, compact, chooseLabel }: {
  name: string; label: string; hint?: ReactNode; folders: string[]; kind?: FileFieldKind; tile?: 'light' | 'dark'; optional?: boolean; compact?: boolean;
  /** Overrides the button text. */
  chooseLabel?: string;
}) {
  const form = useForm();
  const id = fid(name);
  const value = (getPath(form.values, name) as string | null | undefined) ?? null;
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const text = chooseLabel ?? CHOOSE[kind];
  return (
    <div className={`field imgf ${compact ? 'imgf--compact' : ''}`} role="group" aria-labelledby={`${id}-label`}>
      <span className="field__label" id={`${id}-label`}>{label}{optional && <span className="field__opt"> Optional</span>}</span>
      <div className="imgf__row">
        <span className={`imgf__tile imgf__tile--${tile}`}><FilePreview value={value} tile={tile} empty={kind === 'pdf' || kind === 'any' ? 'file' : kind === 'video' ? 'video' : 'gallery'} /></span>
        <div className="imgf__side">
          <p className="imgf__key" id={`${id}-key`}>{value ?? 'No file chosen'}</p>
          <div className="imgf__btns">
            <button ref={btn} id={id} type="button" className="btn btn--ghost btn--sm" aria-label={`${text}: ${label}`} aria-describedby={`${id}-key`} onClick={() => setOpen(true)}>{text}</button>
            {value && <button type="button" className="link imgf__rm" onClick={() => form.set(name, null)}>Remove</button>}
          </div>
        </div>
      </div>
      {hint && <p className="field__hint">{hint}</p>}
      {open && <MediaPicker prefixes={folders} kinds={KIND_FILTER[kind]} current={value} tile={tile} onClose={() => setOpen(false)} onPick={(k) => { form.set(name, k); setOpen(false); }} />}
    </div>
  );
}

/** An image (raster or SVG) from the media library: FileField with kind "image". */
export function ImageField(props: Omit<React.ComponentProps<typeof FileField>, 'kind'>) {
  return <FileField {...props} kind="image" />;
}
