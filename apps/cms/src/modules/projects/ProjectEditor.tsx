import { useRef } from 'react';
import { useParams, useRouter } from '@tanstack/react-router';
import { useCreateProject, useDeleteProject, useProjects, useUpdateProject } from './data/hooks';
import type { Project, ProjectInput } from './data/types';
import { isUrl } from '../../lib/format';
import type { Errors } from '../../lib/form';
import { uid, useEditForm } from '../../lib/form';
import { isSlug, slugify } from '../../lib/slug';
import { EditorFrame, BilingualField, Callout, EditorMissing, EditorSkeleton, ImageField, Repeater, Section, SlugField, TextField } from '../../components/edit';

const WEBSITE = import.meta.env.VITE_WEBSITE_URL;
const host = (u: string) => { try { return new URL(u).host; } catch { return u; } };

// ───────── editor ─────────

interface ProjectForm {
  name: { en: string; ro: string };
  slug: string;
  summary: { en: string; ro: string };
  logo: string | null;
  external: string;
  stats: { k: string; value: string; label: { en: string; ro: string } }[];
  body: { en: string; ro: string };
  facts: { k: string; label: { en: string; ro: string }; value: { en: string; ro: string } }[];
  partners: { k: string; name: string; logo: string | null; href: string }[];
}

const blankPair = () => ({ en: '', ro: '' });

function toForm(p?: Project): ProjectForm {
  if (!p) return { name: blankPair(), slug: '', summary: blankPair(), logo: null, external: '', stats: [], body: blankPair(), facts: [], partners: [] };
  return {
    name: { ...p.name }, slug: p.slug, summary: { ...p.summary }, logo: p.logo, external: p.external ?? '',
    stats: p.stats.map((s) => ({ k: uid(), value: s.value, label: { ...s.label } })),
    body: { en: p.body.en.join('\n\n'), ro: p.body.ro.join('\n\n') },
    facts: p.facts.map((f) => ({ k: uid(), label: { ...f.label }, value: { ...f.value } })),
    partners: p.partners.map((x) => ({ k: uid(), name: x.name, logo: x.logo ?? null, href: x.href ?? '' })),
  };
}

const paragraphs = (s: string) => s.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);

function fromForm(f: ProjectForm, photos: Project['photos']): ProjectInput {
  return {
    name: { en: f.name.en.trim(), ro: f.name.ro.trim() },
    slug: f.slug.trim(),
    summary: { en: f.summary.en.trim(), ro: f.summary.ro.trim() },
    logo: f.logo,
    external: f.external.trim() || null,
    stats: f.stats.map((s) => ({ value: s.value.trim(), label: { en: s.label.en.trim(), ro: s.label.ro.trim() } })),
    body: { en: paragraphs(f.body.en), ro: paragraphs(f.body.ro) },
    facts: f.facts.map((x) => ({ label: { en: x.label.en.trim(), ro: x.label.ro.trim() }, value: { en: x.value.en.trim(), ro: x.value.ro.trim() } })),
    photos,
    partners: f.partners.map((x) => ({ name: x.name.trim(), ...(x.logo ? { logo: x.logo } : {}), ...(x.href.trim() ? { href: x.href.trim() } : {}) })),
  };
}

function validate(f: ProjectForm, taken: string[]): Errors {
  const e: Errors = {};
  if (!f.name.en.trim()) e['name.en'] = 'Give the project a name.';
  const slug = f.slug.trim();
  if (!slug) e.slug = 'A slug is needed for the page address.';
  else if (!isSlug(slug)) e.slug = 'Use lowercase letters, numbers and single hyphens.';
  else if (taken.includes(slug)) e.slug = 'Another project already uses this slug.';
  if (!f.summary.en.trim()) e['summary.en'] = 'Add a one-sentence summary.';
  if (!isUrl(f.external)) e.external = 'Enter a full address that starts with https://.';
  f.stats.forEach((s, i) => {
    if (!s.value.trim()) e[`stats.${i}.value`] = 'Enter the number, like 1,200+.';
    if (!s.label.en.trim()) e[`stats.${i}.label.en`] = 'Say what the number counts.';
  });
  f.facts.forEach((x, i) => {
    if (!x.label.en.trim()) e[`facts.${i}.label.en`] = 'Name the fact, like Started.';
    if (!x.value.en.trim()) e[`facts.${i}.value.en`] = 'Add its value.';
  });
  f.partners.forEach((x, i) => {
    if (!x.name.trim()) e[`partners.${i}.name`] = 'Enter the partner’s name.';
    if (!isUrl(x.href)) e[`partners.${i}.href`] = 'Enter a full address that starts with https://.';
  });
  return e;
}

export function ProjectEdit() {
  const { id } = useParams({ strict: false }) as { id: string };
  const q = useProjects();
  if (q.isPending) return <EditorSkeleton />;
  const project = q.data?.find((p) => p.id === id);
  if (!project) return <EditorMissing noun="project" backHref="/projects" backLabel="All projects" />;
  return <ProjectEditor key={project.id} project={project} />;
}

export function ProjectNew() {
  return <ProjectEditor key="new" />;
}

function ProjectEditor({ project }: { project?: Project }) {
  const router = useRouter();
  const all = useProjects().data ?? [];
  const create = useCreateProject();
  const update = useUpdateProject();
  const del = useDeleteProject();
  const autoSlug = useRef(!project || project.slug === slugify(project.name.en));

  const form = useEditForm<ProjectForm>({
    initial: toForm(project),
    validate: (v) => validate(v, all.filter((p) => p.id !== project?.id).map((p) => p.slug)),
    derive: (next, changed) => (changed === 'name.en' && autoSlug.current ? { ...next, slug: slugify(next.name.en) } : next),
    save: (v) => (project ? update.mutateAsync({ id: project.id, input: fromForm(v, project.photos) }) : create.mutateAsync(fromForm(v, []))),
    onSaved: (res) => { if (!project) router.history.replace(`/projects/${(res as Project).id}`); },
  });

  const external = form.values.external.trim() !== '';
  const off = 'This project has no page of its own, so this is not used.';

  return (
    <EditorFrame
      form={form}
      title={project ? project.name.en : 'New project'}
      edited={project ? { by: project.editedBy, at: project.editedAt } : null}
      back={{ href: '/projects', label: 'All projects' }}
      viewHref={project ? `${WEBSITE}/en/projects${project.external ? '' : `/${project.slug}`}` : undefined}
      remove={project ? { noun: 'project', run: () => del.mutateAsync(project.id), then: '/projects' } : undefined}
    >
      <Section title="Basics">
        <BilingualField name="name" label="Name" />
        <SlugField name="slug" prefix="/projects/" hint="The page address. It starts as the English name; change it by hand if you like." onManualEdit={() => { autoSlug.current = false; }} />
        <BilingualField name="summary" label="Summary" multiline softMax={140} hint="One sentence. It is the card text and the page’s first line." />
        <ImageField name="logo" label="Logo" tile="dark" folders={['projects/', 'brand/']} hint="Until you choose one, the team logo stands in." />
        <TextField name="external" label="External address" type="url" optional placeholder="https://" hint="Only for a project that lives somewhere else, like BrickDocs." />
        {external && <Callout>This project has no page of its own. Its card links straight to <b>{host(form.values.external.trim())}</b>, so the sections below are not used.</Callout>}
      </Section>

      <Section title="Impact numbers" off={external} offNote={off} note="Up to four big numbers beside the logo, like people reached or editions.">
        <Repeater name="stats" label="Numbers" itemLabel="Number" addLabel="Add a number" max={4} empty="No numbers yet." blank={() => ({ k: uid(), value: '', label: blankPair() })}>
          {(i) => (
            <>
              <TextField name={`stats.${i}.value`} label="Value" placeholder="1,200+" />
              <BilingualField name={`stats.${i}.label`} label="What it counts" placeholder="People reached" />
            </>
          )}
        </Repeater>
      </Section>

      <Section title="About" off={external} offNote={off}>
        <BilingualField name="body" label="Description" multiline optional hint="Separate paragraphs with a blank line." />
        <Repeater name="facts" label="At a glance" itemLabel="Fact" addLabel="Add a fact" empty="No facts yet. Good ones: Started, How often, Who it’s for, Where." blank={() => ({ k: uid(), label: blankPair(), value: blankPair() })}>
          {(i) => (
            <>
              <BilingualField name={`facts.${i}.label`} label="Label" placeholder="Started" />
              <BilingualField name={`facts.${i}.value`} label="Value" placeholder="2023" />
            </>
          )}
        </Repeater>
      </Section>

      <Section title="Photos" off={external} offNote={off}>
        <p className="esec__plain">
          {project && project.photos.length > 0 ? `${project.photos.length} photos are attached. ` : 'No photos yet. '}
          Adding and arranging photos arrives with the Media library module.
        </p>
      </Section>

      <Section title="Partners" off={external} offNote={off} note="Who makes the project possible. They show as logos on the project page.">
        <Repeater name="partners" label="Partners" itemLabel="Partner" addLabel="Add a partner" empty="No partners yet." blank={() => ({ k: uid(), name: '', logo: null, href: '' })}>
          {(i) => (
            <>
              <TextField name={`partners.${i}.name`} label="Name" />
              <TextField name={`partners.${i}.href`} label="Link" type="url" optional placeholder="https://" />
              <ImageField name={`partners.${i}.logo`} label="Logo" tile="dark" folders={['sponsors/', 'projects/']} optional compact />
            </>
          )}
        </Repeater>
      </Section>
    </EditorFrame>
  );
}

