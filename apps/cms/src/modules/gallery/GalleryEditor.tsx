import { useParams } from '@tanstack/react-router';
import { useDeleteGalleryItem, useGallery, useUpdateGalleryItem } from './data/hooks';
import type { GalleryInput, GalleryItem } from './data/types';
import { useSeasons } from '../../lib/data/hooks';
import { fileLeaf, mediaApi, mediaKind, mediaUrl } from '../../lib/data/media';
import { videoPoster } from '../../lib/cdn';
import { useEditForm } from '../../lib/form';
import type { Errors } from '../../lib/form';
import { BilingualField, DateField, EditorFrame, EditorMissing, EditorSkeleton, FileField, SelectField, TextField, ToggleField, Section } from '../../components/edit';
import { itemLabel } from './data/preview';
import { parseYouTube, ytWatch } from './youtube';
import { GalleryThumb } from './GalleryThumb';

const WEBSITE = import.meta.env.VITE_WEBSITE_URL;

interface Form { youtube: string; key: string | null; season: string; date: string; featured: boolean; caption: { en: string; ro: string }; alt: { en: string; ro: string } }

const toForm = (i: GalleryItem): Form => ({
  youtube: i.youtubeId ? ytWatch(i.youtubeId) : '', key: i.key, season: i.season ?? '', date: i.date ?? '', featured: i.featured, caption: { ...i.caption }, alt: { ...i.alt },
});

function validate(f: Form, kind: GalleryItem['kind'], others: string[]): Errors {
  const e: Errors = {};
  if (kind === 'youtube') {
    const id = parseYouTube(f.youtube);
    if (!id) e.youtube = 'Paste a YouTube link, like https://youtu.be/… or https://www.youtube.com/watch?v=…';
    else if (others.includes(id)) e.youtube = 'This video is already in the gallery.';
  } else if (!f.key) e.key = kind === 'video' ? 'Choose a video clip.' : 'Choose a photo.';
  else if (kind === 'photo' && mediaKind(f.key) !== 'image') e.key = 'The gallery takes photos here, not SVG graphics.';
  return e;
}

export function GalleryEdit() {
  const { id } = useParams({ strict: false }) as { id: string };
  const q = useGallery();
  if (q.isPending) return <EditorSkeleton />;
  const item = q.data?.find((i) => i.id === id);
  if (!item) return <EditorMissing noun="gallery item" backHref="/gallery" backLabel="All gallery items" />;
  return <Editor key={item.id} item={item} others={q.data!.filter((i) => i.id !== id && i.youtubeId).map((i) => i.youtubeId!)} />;
}

function Editor({ item, others }: { item: GalleryItem; others: string[] }) {
  const update = useUpdateGalleryItem();
  const del = useDeleteGalleryItem();
  const seasons = useSeasons().data ?? [];

  const form = useEditForm<Form>({
    initial: toForm(item),
    validate: (v) => validate(v, item.kind, others),
    save: async (v) => {
      let { width, height } = item;
      if (item.kind !== 'youtube' && v.key && v.key !== item.key) {
        const f = (await mediaApi.list({ prefixes: [v.key] })).find((x) => x.key === v.key);
        if (f?.width && f.height) { width = f.width; height = f.height; }
      }
      const input: GalleryInput = {
        kind: item.kind, key: item.kind === 'youtube' ? null : v.key, youtubeId: item.kind === 'youtube' ? parseYouTube(v.youtube) : null, width, height,
        season: v.season || null, date: v.date || null, featured: v.featured,
        alt: { en: v.alt.en.trim(), ro: v.alt.ro.trim() }, caption: { en: v.caption.en.trim(), ro: v.caption.ro.trim() },
      };
      return update.mutateAsync({ id: item.id, input });
    },
  });

  const v = form.values;
  const preview = { kind: item.kind, key: v.key, youtubeId: item.kind === 'youtube' ? parseYouTube(v.youtube) : null };
  const kindWord = item.kind === 'photo' ? 'Photo' : item.kind === 'video' ? 'Video clip' : 'YouTube video';
  const folders = [`gallery/${v.season || 'general'}/`, 'gallery/'];

  return (
    <EditorFrame
      form={form}
      title={itemLabel({ ...item, caption: v.caption })}
      edited={{ by: item.editedBy, at: item.editedAt }}
      back={{ href: '/gallery', label: 'All gallery items' }}
      viewHref={`${WEBSITE}/en/gallery`}
      remove={{ noun: 'gallery item', run: () => del.mutateAsync(item.id), then: '/gallery' }}
    >
      <div className="gal__prev" data-kind={item.kind}>
        {item.kind === 'video' && v.key
          ? <video controls preload="metadata" src={mediaUrl(v.key)} poster={mediaUrl(videoPoster(v.key))} aria-label="Clip preview" />
          : <span className="gal__previmg"><GalleryThumb item={preview} width={960} /></span>}
      </div>
      <p className="gal__kind label">{kindWord}{v.key ? ` · ${fileLeaf(v.key)}` : ''}</p>

      <Section title={item.kind === 'youtube' ? 'Video' : 'File'}>
        {item.kind === 'youtube'
          ? <TextField name="youtube" label="YouTube link" type="url" placeholder="https://youtu.be/…" hint="Long videos live on YouTube. The id and thumbnail come from the link." />
          : <FileField name="key" label={item.kind === 'video' ? 'Clip' : 'Photo'} kind={item.kind === 'video' ? 'video' : 'image'} folders={folders} hint="Replacing the file keeps the caption, season and date." />}
      </Section>
      <Section title="Details">
        <BilingualField name="caption" label="Caption" optional multiline softMax={140} hint="Shown with the picture in the Gallery. Both languages are needed for the Romanian site." />
        <BilingualField name="alt" label="Alt text" optional multiline hint="Describes the picture for screen readers. Without it the website uses the caption." />
        <SelectField name="season" label="Season" options={[{ value: '', label: 'General (no season)' }, ...seasons.map((s) => ({ value: s.id, label: `${s.game} ${s.years}` }))]} />
        <DateField name="date" label="Date" optional hint="The website shows the month and year." />
        <ToggleField name="featured" label="Featured" hint="Featured items can be picked first on the Home and Gallery pages." />
      </Section>
    </EditorFrame>
  );
}
