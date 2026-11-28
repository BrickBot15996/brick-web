import { BilingualField, FileField, ImageField, Section, SelectField, SettingsError, SettingsPage, SettingsSkeleton } from '../../components/edit';
import type { Errors } from '../../lib/form';
import { useEditForm } from '../../lib/form';
import { useHero, useSaveHero } from './data/hooks';
import type { Hero, HeroInput, HeroMediaType } from './data/types';

const WEBSITE = import.meta.env.VITE_WEBSITE_URL;

interface Form { tagline: { en: string; ro: string }; intro: { en: string; ro: string }; mediaType: HeroMediaType; media: string | null; poster: string | null }

const toForm = (h: Hero): Form => ({ tagline: { ...h.tagline }, intro: { ...h.intro }, mediaType: h.mediaType, media: h.media, poster: h.poster });
const fromForm = (f: Form): HeroInput => ({
  tagline: { en: f.tagline.en.trim(), ro: f.tagline.ro.trim() },
  intro: { en: f.intro.en.trim(), ro: f.intro.ro.trim() },
  mediaType: f.mediaType,
  media: f.media,
  poster: f.mediaType === 'video' ? f.poster : null,
});
function validate(f: Form): Errors {
  const e: Errors = {};
  if (!f.tagline.en.trim()) e['tagline.en'] = 'Write the tagline.';
  if (f.mediaType === 'video' && f.media && !f.poster) e.poster = 'Choose a poster image. It shows while the video loads.';
  return e;
}

export function HeroTab() {
  const q = useHero();
  if (q.isPending) return <SettingsSkeleton />;
  if (q.isError) return <SettingsError onRetry={() => void q.refetch()} text="Couldn’t load the hero." />;
  return <HeroEditor hero={q.data} />;
}

function HeroEditor({ hero }: { hero: Hero }) {
  const save = useSaveHero();
  const form = useEditForm<Form>({ initial: toForm(hero), validate, save: (v) => save.mutateAsync(fromForm(v)) });
  const video = form.values.mediaType === 'video';
  return (
    <SettingsPage form={form} title="Hero" edited={{ by: hero.editedBy, at: hero.editedAt }} viewHref={`${WEBSITE}/en`}>
      <Section title="Tagline and intro" note="The first thing visitors read. The legacy tagline is “We build our future Brick by Brick!”.">
        <BilingualField name="tagline" label="Tagline" multiline softMax={60} />
        <BilingualField name="intro" label="Short intro" multiline optional hint="FTC team #15996, CNU Focșani, the first FTC team in Vrancea county." />
      </Section>
      <Section title="Hero media">
        <SelectField name="mediaType" label="Type" options={[{ value: 'image', label: 'Photo' }, { value: 'video', label: 'Video clip' }]} />
        {video
          ? <FileField name="media" label="Video" kind="video" folders={['site/home/']} optional hint="MP4, H.264, 1080p at most, under about 50 MB." />
          : <ImageField name="media" label="Photo" tile="dark" folders={['site/home/']} optional />}
        {video && <ImageField name="poster" label="Poster" tile="dark" folders={['site/home/']} optional hint="Shown before the video plays." />}
      </Section>
    </SettingsPage>
  );
}
