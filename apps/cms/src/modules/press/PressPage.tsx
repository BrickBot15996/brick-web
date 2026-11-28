import { BilingualField, BilingualMarkdownField, FileField, ImageField, Repeater, Section, SelectField, SettingsError, SettingsPage, SettingsSkeleton, TextField } from '../../components/edit';
import type { Errors } from '../../lib/form';
import { uid, useEditForm } from '../../lib/form';
import { usePressKit, useSavePressKit } from './data/hooks';
import type { PressKit, PressKitInput, PressMarks, PressPhotoKind } from './data/types';

const WEBSITE = import.meta.env.VITE_WEBSITE_URL;
const pair = () => ({ en: '', ro: '' });
const trim = (p: { en: string; ro: string }) => ({ en: p.en.trim(), ro: p.ro.trim() });
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Form {
  marks: PressMarks;
  photos: { k: string; id: string; kind: PressPhotoKind; file: string | null; alt: { en: string; ro: string } }[];
  shortDescription: { en: string; ro: string };
  longDescription: { en: string; ro: string };
  contactEmail: string;
}

const toForm = (p: PressKit): Form => ({
  marks: { ...p.marks },
  photos: p.photos.map((x) => ({ k: uid(), id: x.id, kind: x.kind, file: x.file, alt: { ...x.alt } })),
  shortDescription: { ...p.shortDescription }, longDescription: { ...p.longDescription }, contactEmail: p.contactEmail,
});
const fromForm = (f: Form): PressKitInput => ({
  marks: f.marks,
  photos: f.photos.filter((x) => x.file).map((x) => ({ id: x.id, kind: x.kind, file: x.file as string, alt: trim(x.alt) })),
  shortDescription: trim(f.shortDescription), longDescription: trim(f.longDescription), contactEmail: f.contactEmail.trim(),
});
function validate(f: Form): Errors {
  const e: Errors = {};
  f.photos.forEach((x, i) => {
    if (!x.file) e[`photos.${i}.file`] = 'Choose a photo, or remove this one.';
    else if (!x.alt.en.trim()) e[`photos.${i}.alt.en`] = 'Describe the photo for people who can’t see it.';
  });
  if (!f.shortDescription.en.trim()) e['shortDescription.en'] = 'Write the short description.';
  if (!f.longDescription.en.trim()) e['longDescription.en'] = 'Write the long description.';
  if (!f.contactEmail.trim()) e.contactEmail = 'Add the press contact.';
  else if (!EMAIL.test(f.contactEmail.trim())) e.contactEmail = 'Enter an email address like name@brickbot.ro.';
  return e;
}

/** Slot order: the four logo files, then the four wordmark files. */
const SLOTS: { key: keyof PressMarks; label: string; kind: 'svg' | 'image'; tile: 'light' | 'dark' }[] = [
  { key: 'logoSvgDark', label: 'Logo, SVG, for dark backgrounds', kind: 'svg', tile: 'dark' },
  { key: 'logoSvgLight', label: 'Logo, SVG, for light backgrounds', kind: 'svg', tile: 'light' },
  { key: 'logoPngDark', label: 'Logo, PNG, for dark backgrounds', kind: 'image', tile: 'dark' },
  { key: 'logoPngLight', label: 'Logo, PNG, for light backgrounds', kind: 'image', tile: 'light' },
  { key: 'wordmarkSvgDark', label: 'Wordmark, SVG, for dark backgrounds', kind: 'svg', tile: 'dark' },
  { key: 'wordmarkSvgLight', label: 'Wordmark, SVG, for light backgrounds', kind: 'svg', tile: 'light' },
  { key: 'wordmarkPngDark', label: 'Wordmark, PNG, for dark backgrounds', kind: 'image', tile: 'dark' },
  { key: 'wordmarkPngLight', label: 'Wordmark, PNG, for light backgrounds', kind: 'image', tile: 'light' },
];

export function PressPage() {
  const q = usePressKit();
  if (q.isPending) return <SettingsSkeleton />;
  if (q.isError) return <SettingsError onRetry={() => void q.refetch()} text="Couldn’t load the press kit." />;
  return <PressEditor kit={q.data} />;
}

function PressEditor({ kit }: { kit: PressKit }) {
  const save = useSavePressKit();
  const form = useEditForm<Form>({ initial: toForm(kit), validate, save: (v) => save.mutateAsync(fromForm(v)) });
  return (
    <SettingsPage form={form} title="Press kit" edited={{ by: kit.editedBy, at: kit.editedAt }} viewHref={`${WEBSITE}/en/press`}>
      <Section title="Logos and wordmark" note="The files journalists download. Pick them from brand/ in the media library; leave a slot empty to leave that variant off the page.">
        <div className="press-grid">
          {SLOTS.map((s) => (
            <FileField key={s.key} name={`marks.${s.key}`} label={s.label} kind={s.kind} tile={s.tile} folders={['brand/']} optional compact chooseLabel={s.kind === 'svg' ? 'Choose SVG' : 'Choose PNG'} />
          ))}
        </div>
      </Section>
      <Section title="Approved photos" note="Team and robot photos the press may use. Every photo needs alt text in both languages.">
        <Repeater name="photos" label="Photos" itemLabel="Photo" addLabel="Add a photo" empty="No photos yet." blank={() => ({ k: uid(), id: `photo-${uid()}`, kind: 'team', file: null, alt: pair() })}>
          {(i) => (
            <>
              <ImageField name={`photos.${i}.file`} label="Photo" tile="dark" folders={['press/photos/']} compact />
              <SelectField name={`photos.${i}.kind`} label="Shows" options={[{ value: 'team', label: 'The team' }, { value: 'robot', label: 'The robot' }]} />
              <BilingualField name={`photos.${i}.alt`} label="Alt text" />
            </>
          )}
        </Repeater>
      </Section>
      <Section title="Descriptions">
        <BilingualField name="shortDescription" label="Short description" multiline softMax={200} hint="One or two sentences, for captions and listings." />
        <BilingualMarkdownField name="longDescription" label="Long description" />
      </Section>
      <Section title="Press contact">
        <TextField name="contactEmail" label="Email" type="email" hint="Defaults to the team’s only public address, contact@brickbot.ro." />
      </Section>
    </SettingsPage>
  );
}
