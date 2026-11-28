import { BilingualField, BilingualMarkdownField, ImageField, Repeater, Section, SettingsError, SettingsPage, SettingsSkeleton } from '../../components/edit';
import type { Errors } from '../../lib/form';
import { uid, useEditForm } from '../../lib/form';
import { useMission, useSaveMission } from './data/hooks';
import type { Mission, MissionInput } from './data/types';

const WEBSITE = import.meta.env.VITE_WEBSITE_URL;
const pair = () => ({ en: '', ro: '' });

interface Form {
  mission: { en: string; ro: string };
  drive: { en: string; ro: string };
  values: { k: string; name: { en: string; ro: string }; line: { en: string; ro: string } }[];
  studentsDo: { en: string; ro: string };
  teamPhoto: string | null;
}

const toForm = (m: Mission): Form => ({
  mission: { ...m.mission }, drive: { ...m.drive }, studentsDo: { ...m.studentsDo }, teamPhoto: m.teamPhoto,
  values: m.values.map((v) => ({ k: uid(), name: { ...v.name }, line: { ...v.line } })),
});
const trim = (p: { en: string; ro: string }) => ({ en: p.en.trim(), ro: p.ro.trim() });
const fromForm = (f: Form): MissionInput => ({
  mission: trim(f.mission), drive: trim(f.drive), studentsDo: trim(f.studentsDo), teamPhoto: f.teamPhoto,
  values: f.values.map((v) => ({ name: trim(v.name), line: trim(v.line) })),
});
function validate(f: Form): Errors {
  const e: Errors = {};
  if (!f.mission.en.trim()) e['mission.en'] = 'Write the mission.';
  f.values.forEach((v, i) => { if (!v.name.en.trim()) e[`values.${i}.name.en`] = 'Name the value.'; });
  return e;
}

export function MissionTab() {
  const q = useMission();
  if (q.isPending) return <SettingsSkeleton />;
  if (q.isError) return <SettingsError onRetry={() => void q.refetch()} text="Couldn’t load the mission text." />;
  return <MissionEditor mission={q.data} />;
}

function MissionEditor({ mission }: { mission: Mission }) {
  const save = useSaveMission();
  const form = useEditForm<Form>({ initial: toForm(mission), validate, save: (v) => save.mutateAsync(fromForm(v)) });
  return (
    <SettingsPage form={form} title="Mission" edited={{ by: mission.editedBy, at: mission.editedAt }} viewHref={`${WEBSITE}/en/team`}>
      <Section title="Mission and what drives us" note="The two paragraphs at the top of The Team page.">
        <BilingualMarkdownField name="mission" label="Mission" />
        <BilingualMarkdownField name="drive" label="What drives us" />
      </Section>
      <Section title="Values" note="Legacy values: outreach, creativity, ambition, team spirit.">
        <Repeater name="values" label="Values" itemLabel="Value" addLabel="Add a value" max={6} empty="No values yet." blank={() => ({ k: uid(), name: pair(), line: pair() })}>
          {(i) => (
            <>
              <BilingualField name={`values.${i}.name`} label="Name" placeholder="Outreach" />
              <BilingualField name={`values.${i}.line`} label="One line" optional multiline />
            </>
          )}
        </Repeater>
      </Section>
      <Section title="What our students do" note="The range of things people get to do here, told as experiences, not as a list of departments.">
        <BilingualMarkdownField name="studentsDo" label="Copy" />
      </Section>
      <Section title="Team photo" note="The current team photo on The Team page. Season group photos live in Seasons.">
        <ImageField name="teamPhoto" label="Current team photo" tile="dark" folders={['site/team/']} optional />
      </Section>
    </SettingsPage>
  );
}
