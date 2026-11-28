import { AppLink } from '../../components/AppLink';
import { BilingualField, BilingualMarkdownField, ImageField, Repeater, Section, SettingsError, SettingsPage, SettingsSkeleton } from '../../components/edit';
import type { Errors } from '../../lib/form';
import { uid, useEditForm } from '../../lib/form';
import { useJoinPage, useSaveJoin } from './data/hooks';
import type { JoinInput, JoinPage } from './data/types';

const WEBSITE = import.meta.env.VITE_WEBSITE_URL;
const pair = () => ({ en: '', ro: '' });

interface Form {
  requirements: { en: string; ro: string };
  departments: { k: string; id: string; name: { en: string; ro: string }; description: { en: string; ro: string }; photos: { k: string; file: string | null; alt: { en: string; ro: string } }[] }[];
}

const toForm = (j: JoinPage): Form => ({
  requirements: { ...j.requirements },
  departments: j.departments.map((d) => ({
    k: uid(), id: d.id, name: { ...d.name }, description: { ...d.description },
    photos: d.photos.map((p) => ({ k: uid(), file: p.file, alt: { ...p.alt } })),
  })),
});
const trim = (p: { en: string; ro: string }) => ({ en: p.en.trim(), ro: p.ro.trim() });
const fromForm = (f: Form): JoinInput => ({
  requirements: trim(f.requirements),
  departments: f.departments.map((d) => ({
    id: d.id, name: trim(d.name), description: trim(d.description),
    photos: d.photos.filter((p) => p.file).map((p) => ({ file: p.file as string, alt: trim(p.alt) })),
  })),
});
function validate(f: Form): Errors {
  const e: Errors = {};
  if (!f.requirements.en.trim()) e['requirements.en'] = 'List who can join.';
  f.departments.forEach((d, i) => {
    if (!d.name.en.trim()) e[`departments.${i}.name.en`] = 'Name the department.';
    if (!d.description.en.trim()) e[`departments.${i}.description.en`] = 'Describe what people do here.';
    d.photos.forEach((p, j) => {
      if (!p.file) e[`departments.${i}.photos.${j}.file`] = 'Choose a photo, or remove this one.';
      if (p.file && !p.alt.en.trim()) e[`departments.${i}.photos.${j}.alt.en`] = 'Describe the photo for people who can’t see it.';
    });
  });
  return e;
}

export function JoinTab() {
  const q = useJoinPage();
  if (q.isPending) return <SettingsSkeleton />;
  if (q.isError) return <SettingsError onRetry={() => void q.refetch()} text="Couldn’t load the Join page." />;
  return <JoinEditor join={q.data} />;
}

function JoinEditor({ join }: { join: JoinPage }) {
  const save = useSaveJoin();
  const form = useEditForm<Form>({ initial: toForm(join), validate, save: (v) => save.mutateAsync(fromForm(v)) });
  return (
    <SettingsPage form={form} title="Join page" edited={{ by: join.editedBy, at: join.editedAt }} viewHref={`${WEBSITE}/en/join`}>
      <Section title="Requirements" note="Legacy: a student at CNU Focșani, over 13, no prior experience needed.">
        <BilingualMarkdownField name="requirements" label="Who can join" />
      </Section>
      <Section title="Apply button">
        <p className="esec__plain">The Apply button opens <b>brickbot.ro/apply</b>, a short URL that points at the Google Form. To change where it goes, edit it in <AppLink href="/short-urls" className="link">Short URLs</AppLink>.</p>
      </Section>
      <Section title="Departments" note="The one place on the site where departments are listed. Each gets a description and photos.">
        {/* The seven departments are fixed in number by the brief but names and order stay editable. */}
        <Repeater name="departments" label="Departments" itemLabel="Department" addLabel="Add a department" empty="No departments yet." blank={() => ({ k: uid(), id: `department-${uid()}`, name: pair(), description: pair(), photos: [] })}>
          {(i) => (
            <>
              <BilingualField name={`departments.${i}.name`} label="Name" />
              <BilingualField name={`departments.${i}.description`} label="Description" multiline />
              <Repeater name={`departments.${i}.photos`} label="Photos" itemLabel="Photo" addLabel="Add a photo" empty="No photos yet." blank={() => ({ k: uid(), file: null, alt: pair() })}>
                {(j) => (
                  <>
                    <ImageField name={`departments.${i}.photos.${j}.file`} label="Photo" tile="dark" folders={[`site/join/${form.values.departments[i]?.id ?? ''}/`, 'site/join/']} compact />
                    <BilingualField name={`departments.${i}.photos.${j}.alt`} label="Alt text" />
                  </>
                )}
              </Repeater>
            </>
          )}
        </Repeater>
      </Section>
    </SettingsPage>
  );
}
