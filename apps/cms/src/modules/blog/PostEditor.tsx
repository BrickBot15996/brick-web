import { useRef, useState } from 'react';
import { Tag } from '../../components/Tag';
import { useParams, useRouter } from '@tanstack/react-router';
import { useCreatePost, useDeletePost, usePosts, useTopics, useUpdatePost } from './data/hooks';
import { emptyDoc, isEmptyDoc, readingMinutes } from './data/doc';
import type { RichDoc } from './data/doc';
import { issueSentences, publishIssues } from './data/rules';
import type { Post, PostInput, PostStatus } from './data/types';
import { RichText } from './RichText';
import { useProjects } from '../projects/data/hooks';
import { useSeasons } from '../../lib/data/hooks';
import { useShell } from '../../lib/shell';
import { getPath, useEditForm, useForm } from '../../lib/form';
import type { Errors } from '../../lib/form';
import { isSlug, slugify } from '../../lib/slug';
import { Icon } from '../../components/icons';
import { BilingualField, Callout, DateTimeField, EditorFrame, EditorMissing, EditorSkeleton, fid, ImageField, Section, SelectField, SlugField, TagPicker } from '../../components/edit';

const WEBSITE = import.meta.env.VITE_WEBSITE_URL;

interface PostForm {
  title: { en: string; ro: string };
  slug: string;
  excerpt: { en: string; ro: string };
  cover: string | null;
  body: { en: RichDoc; ro: RichDoc };
  topics: string[];
  projects: string[];
  season: string;
  status: PostStatus;
  publishAt: string;
  seo: { title: { en: string; ro: string }; description: { en: string; ro: string } };
}

const pair = () => ({ en: '', ro: '' });

function toForm(p?: Post): PostForm {
  if (!p) return { title: pair(), slug: '', excerpt: pair(), cover: null, body: { en: emptyDoc(), ro: emptyDoc() }, topics: [], projects: [], season: '', status: 'draft', publishAt: '', seo: { title: pair(), description: pair() } };
  return {
    title: { ...p.title }, slug: p.slug, excerpt: { ...p.excerpt }, cover: p.cover, body: { en: p.body.en, ro: p.body.ro },
    topics: [...p.topics], projects: [...p.projects], season: p.season ?? '', status: p.status, publishAt: p.publishAt ?? '',
    seo: { title: { ...p.seo.title }, description: { ...p.seo.description } },
  };
}

const trimPair = (x: { en: string; ro: string }) => ({ en: x.en.trim(), ro: x.ro.trim() });

function fromForm(f: PostForm): PostInput {
  return {
    title: trimPair(f.title), slug: f.slug.trim(), excerpt: trimPair(f.excerpt), cover: f.cover, body: f.body,
    topics: f.topics, projects: f.projects, season: f.season || null, status: f.status,
    publishAt: f.status === 'scheduled' ? f.publishAt || null : null,
    seo: { title: trimPair(f.seo.title), description: trimPair(f.seo.description) },
  };
}

const LANG = { en: 'English', ro: 'Romanian' } as const;

function validate(f: PostForm, taken: string[], savedPublishAt: string): Errors {
  const e: Errors = {};
  if (!f.title.en.trim()) e['title.en'] = 'Give the post an English title.';
  const slug = f.slug.trim();
  if (!slug) e.slug = 'A slug is needed for the page address.';
  else if (!isSlug(slug)) e.slug = 'Use lowercase letters, numbers and single hyphens.';
  else if (taken.includes(slug)) e.slug = 'Another post already uses this slug.';
  if (f.status !== 'draft') {
    const issues = publishIssues({ title: f.title, excerpt: f.excerpt, body: f.body, topics: f.topics });
    for (const l of ['en', 'ro'] as const) {
      if (issues[l].includes('title') && !e[`title.${l}`]) e[`title.${l}`] = `The ${LANG[l]} title is needed before this can go live.`;
      if (issues[l].includes('excerpt')) e[`excerpt.${l}`] = `The ${LANG[l]} excerpt is needed before this can go live.`;
      if (issues[l].includes('body')) e[`body.${l}`] = `The ${LANG[l]} body is empty.`;
    }
    if (issues.topics) e.topics = 'Pick at least one topic before this can go live.';
    const s = issueSentences(issues);
    if (s.length) e.status = s.join(' ');
  }
  if (f.status === 'scheduled') {
    if (!f.publishAt) e.publishAt = 'Pick the time it should go live.';
    else if (f.publishAt !== savedPublishAt && Date.parse(f.publishAt) <= Date.now()) e.publishAt = 'Pick a time in the future, or choose Published to go live now.';
  }
  return e;
}

export function PostEdit() {
  const { id } = useParams({ strict: false }) as { id: string };
  const q = usePosts();
  if (q.isPending) return <EditorSkeleton />;
  const post = q.data?.find((p) => p.id === id);
  if (!post) return <EditorMissing noun="post" backHref="/blog/posts" backLabel="All posts" />;
  return <PostEditor key={post.id} post={post} />;
}

export function PostNew() {
  return <PostEditor key="new" />;
}

function PostEditor({ post }: { post?: Post }) {
  const router = useRouter();
  const { session } = useShell();
  const all = usePosts().data ?? [];
  const topics = useTopics().data ?? [];
  const projects = useProjects().data ?? [];
  const seasons = useSeasons().data ?? [];
  const create = useCreatePost();
  const update = useUpdatePost();
  const del = useDeletePost();
  const autoSlug = useRef(!post || post.slug === slugify(post.title.en));

  const form = useEditForm<PostForm>({
    initial: toForm(post),
    validate: (v) => validate(v, all.filter((p) => p.id !== post?.id).map((p) => p.slug), post?.publishAt ?? ''),
    derive: (next, changed) => (changed === 'title.en' && autoSlug.current ? { ...next, slug: slugify(next.title.en) } : next),
    save: (v) => (post ? update.mutateAsync({ id: post.id, input: fromForm(v) }) : create.mutateAsync(fromForm(v))),
    onSaved: (res) => { if (!post) router.history.replace(`/blog/posts/${(res as Post).id}`); },
  });

  const v = form.values;
  const folder = isSlug(v.slug.trim()) ? `blog/${v.slug.trim()}/` : 'blog/';
  const who = (email: string) => (email === session.email ? 'You' : email);
  const title = post ? post.title.en || 'Untitled post' : 'New post';

  return (
    <EditorFrame
      form={form}
      title={title}
      edited={post ? { by: post.editedBy, at: post.editedAt } : null}
      back={{ href: '/blog/posts', label: 'All posts' }}
      viewHref={post?.status === 'published' ? `${WEBSITE}/en/blog/${post.slug}` : undefined}
      remove={post ? { noun: 'post', run: () => del.mutateAsync(post.id), then: '/blog/posts' } : undefined}
    >
      <Section title="Basics">
        <BilingualField name="title" label="Title" />
        <SlugField name="slug" prefix="/blog/" hint="The page address. It starts as the English title; change it by hand if you like." onManualEdit={() => { autoSlug.current = false; }} />
        <ImageField name="cover" label="Cover image" tile="dark" optional folders={[folder]} hint={<>Uploaded to <code>{folder}</code>. It shows on the post page and as the preview on social media.</>} />
        <BilingualField name="excerpt" label="Excerpt" multiline softMax={200} hint="Two sentences at most. It is the card text in the post list." />
      </Section>

      <Section title="Body" note="Write both languages. Headings H2 and H3 only: the post title is already the page’s H1.">
        <BodyPair folders={[folder]} />
      </Section>

      <Section title="Tags">
        <TagPicker name="topics" label="Topics" options={topics.map((t) => ({ value: t.id, label: t.name.en }))} placeholder="Add a topic…" emptyText="Every topic is already added." hint="At least one is needed before the post can go live." />
        <TagPicker name="projects" label="Projects" optional options={projects.map((p) => ({ value: p.id, label: p.name.en }))} placeholder="Add a project…" emptyText="Every project is already added." hint="The post also appears on those project pages." />
        <SelectField name="season" label="Season" optional placeholder="No season" options={seasons.map((s) => ({ value: s.id, label: `${s.game} ${s.years}` }))} hint="At most one." />
      </Section>

      <Section title="Publishing">
        <StatusPicker />
        {v.status === 'scheduled' && <DateTimeField name="publishAt" label="Go live at" hint="It is published by the first rebuild after this time." />}
        <Readiness />
        <ReadingTime />
        <Callout>A published post goes live on the next Publish. The scheduler also rebuilds the website every day, so scheduled posts appear within a day at the latest.</Callout>
        <p className="blog-by">
          {post ? post.createdBy || post.editedBy ? <>Created by <b>{who(post.createdBy) || 'unknown'}</b> · last edited by <b>{who(post.editedBy) || 'unknown'}</b></> : <>Not edited in the CMS yet.</> : <>Created by <b>You</b> once it is saved.</>}
        </p>
      </Section>

      <SeoSection />
    </EditorFrame>
  );
}

// ───────── body: two editors ─────────

function BodyPair({ folders }: { folders: string[] }) {
  const form = useForm();
  const [lang, setLang] = useState<'en' | 'ro'>('en');
  const settled = form.settled.body as unknown as { en: RichDoc; ro: RichDoc };
  const empty = { en: isEmptyDoc(settled.en), ro: isEmptyDoc(settled.ro) };
  const gap = empty.en !== empty.ro ? (empty.ro ? 'ro' : 'en') : null;

  return (
    <div className="blog-body" data-lang={lang}>
      <div className="blog-lt" role="tablist" aria-label="Body language">
        {(['en', 'ro'] as const).map((l) => (
          <button key={l} type="button" role="tab" id={`blog-tab-${l}`} aria-selected={lang === l} aria-controls={`blog-panel-${l}`} className="blog-lt__tab" onClick={() => setLang(l)}>
            {LANG[l]}{empty[l] && <span className="blog-lt__flag"> · empty</span>}
          </button>
        ))}
      </div>
      <div className="blog-body__cols">
        {(['en', 'ro'] as const).map((l) => {
          const error = form.errors[`body.${l}`];
          return (
            <div key={l} className="blog-col" id={`blog-panel-${l}`} role="tabpanel" aria-labelledby={`blog-tab-${l}`} data-on={lang === l}>
              <Tag className="langtag" decorative>{l.toUpperCase()}</Tag>
              <RichText name={`body.${l}`} label={`Body, ${LANG[l]}`} folders={folders} />
              {error && <p className="field__error" id={`${fid(`body.${l}`)}-err`}>{error}</p>}
              {gap === l && !error && <p className="field__gap"><Icon name="alert" />{l === 'ro' ? 'Romanian is missing.' : 'English is missing.'}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ───────── publishing ─────────

const STATUSES: { value: PostStatus; label: string; hint: string }[] = [
  { value: 'draft', label: 'Draft', hint: 'Only the team sees it.' },
  { value: 'scheduled', label: 'Scheduled', hint: 'Goes live at a time you choose.' },
  { value: 'published', label: 'Published', hint: 'Live on the next Publish.' },
];

function StatusPicker() {
  const form = useForm();
  const status = form.get('status') as PostStatus;
  const error = form.errors.status;
  const base = fid('status');
  return (
    <div className="field" role="radiogroup" aria-labelledby={`${base}-label`}>
      <span className="field__label" id={`${base}-label`}>Status</span>
      <div className="blog-status">
        {STATUSES.map((s) => (
          <label key={s.value} className="blog-status__opt">
            <input type="radio" name={base} className="sr-only" value={s.value} checked={status === s.value} aria-invalid={error && status === s.value ? true : undefined} aria-describedby={`${base}-hint-${s.value}`}
              onChange={() => { form.set('status', s.value); form.blur('status'); }} />
            <span className="blog-status__chip"><span className="blog-status__name">{s.label}</span><span className="blog-status__hint" id={`${base}-hint-${s.value}`}>{s.hint}</span></span>
          </label>
        ))}
      </div>
    </div>
  );
}

/** What stops the post going live, read from the settled values (after the typing pause). Alarm only once a status that needs it is chosen. */
function Readiness() {
  const form = useForm();
  const f = form.settled as unknown as PostForm;
  const issues = publishIssues({ title: f.title, excerpt: f.excerpt, body: f.body, topics: f.topics });
  const lines = issueSentences(issues);
  const blocking = f.status !== 'draft' && lines.length > 0;
  return (
    <div className={`blog-ready ${blocking ? 'blog-ready--block' : ''}`} role="status">
      {lines.length === 0 ? (
        <p><Icon name="check" />Both languages are complete. This post can go live.</p>
      ) : (
        <>
          <p><Icon name="alert" />{blocking ? `It can’t be ${f.status === 'scheduled' ? 'scheduled' : 'published'} yet:` : 'Before this can be scheduled or published:'}</p>
          <ul>{lines.map((l) => <li key={l}>{l}</li>)}</ul>
        </>
      )}
    </div>
  );
}

function ReadingTime() {
  const form = useForm();
  const body = getPath(form.values, 'body') as { en: RichDoc; ro: RichDoc };
  const one = (l: 'en' | 'ro') => { const m = readingMinutes(body[l]); return m === 0 ? 'no text yet' : `${m} min`; };
  return <p className="blog-read tnum">Reading time: English {one('en')} · Romanian {one('ro')}</p>;
}

// ───────── SEO ─────────

function SeoSection() {
  const form = useForm();
  const filled = ['seo.title.en', 'seo.title.ro', 'seo.description.en', 'seo.description.ro'].some((p) => (getPath(form.values, p) as string).trim() !== '');
  return (
    <details className="blog-seo">
      <summary><span className="esec__title">SEO overrides</span><span className="blog-seo__note">Optional{filled ? ' · set' : ''}</span></summary>
      <div className="blog-seo__body">
        <p className="esec__note">Leave empty to use the title and excerpt. Search results show about 60 characters of title and 160 of description.</p>
        <BilingualField name="seo.title" label="Meta title" optional softMax={60} />
        <BilingualField name="seo.description" label="Meta description" optional multiline softMax={160} />
      </div>
    </details>
  );
}
