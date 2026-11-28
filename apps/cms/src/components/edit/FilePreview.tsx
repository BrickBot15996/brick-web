import { useState } from 'react';
import { videoPoster } from '../../lib/cdn';
import { mediaKind, mediaUrl } from '../../lib/data/media';
import { Icon } from '../icons';
import type { IconName } from '../icons';

/**
 * A file's preview tile: the image itself, a video's poster, or an icon for a PDF. Falls back to an icon if the file is
 * missing. Understands base keys of CMS raster uploads and files uploaded in this preview session (lib/data/media).
 */
export function FilePreview({ value, tile, empty = 'gallery' }: { value: string | null; tile: 'light' | 'dark'; /** Icon shown while no file is chosen. */ empty?: IconName }) {
  const [broken, setBroken] = useState<string | null>(null);
  if (!value) return <Icon name={empty} />;
  const kind = mediaKind(value);
  if (kind === 'pdf') return <><Icon name="file" /><span className="fprev__ext">PDF</span></>;
  const src = kind === 'video' ? mediaUrl(videoPoster(value)) : kind === 'other' ? null : mediaUrl(value, 480);
  if (!src || broken === src) return <Icon name={kind === 'video' ? 'video' : 'file'} />;
  return <img src={src} alt="" onError={() => setBroken(src)} data-tile={tile} />;
}
