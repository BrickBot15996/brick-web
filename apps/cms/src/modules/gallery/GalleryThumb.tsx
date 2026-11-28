import { useState } from 'react';
import { videoPoster } from '../../lib/cdn';
import { mediaUrl } from '../../lib/data/media';
import { Icon } from '../../components/icons';
import { LIcon } from '../media/icons';
import type { GalleryItem } from './data/types';
import { ytThumb } from './youtube';

/** The picture of a gallery item: the photo, a clip's poster, or a YouTube thumbnail. Falls back to an icon. */
export function GalleryThumb({ item, width = 480 }: { item: Pick<GalleryItem, 'kind' | 'key' | 'youtubeId'>; width?: number }) {
  const [broken, setBroken] = useState<string | null>(null);
  const src = item.kind === 'youtube' ? (item.youtubeId ? ytThumb(item.youtubeId) : null) : item.key ? (item.kind === 'video' ? mediaUrl(videoPoster(item.key)) : mediaUrl(item.key, width)) : null;
  return (
    <>
      {src && broken !== src ? <img src={src} alt="" loading="lazy" onError={() => setBroken(src)} /> : <Icon name={item.kind === 'photo' ? 'gallery' : 'video'} />}
      {item.kind === 'video' && <span className="gt__badge"><LIcon name="play" /></span>}
      {item.kind === 'youtube' && <span className="gt__badge gt__badge--yt"><LIcon name="youtube" /></span>}
    </>
  );
}
