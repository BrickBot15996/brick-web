import { useRef } from 'react';
import { useParams, useRouter } from '@tanstack/react-router';
import { useCreateTopic, useDeleteTopic, useTopics, useUpdateTopic } from './data/hooks';
import type { Topic } from './data/types';
import { countLabel, useTopicCounts } from './TopicsList';
import type { Errors } from '../../lib/form';
import { useEditForm } from '../../lib/form';
import { isSlug, slugify } from '../../lib/slug';
import { BilingualField, Callout, EditorFrame, EditorMissing, EditorSkeleton, Section, SlugField } from '../../components/edit';

interface TopicForm { name: { en: string; ro: string }; slug: string }

function validate(f: TopicForm, taken: string[]): Errors {
  const e: Errors = {};
  if (!f.name.en.trim()) e['name.en'] = 'Give the topic an English name.';
  const slug = f.slug.trim();
  if (!slug) e.slug = 'A slug is needed.';
  else if (!isSlug(slug)) e.slug = 'Use lowercase letters, numbers and single hyphens.';
  else if (taken.includes(slug)) e.slug = 'Another topic already uses this slug.';
  return e;
}

export function TopicEdit() {
  const { id } = useParams({ strict: false }) as { id: string };
  const q = useTopics();
  if (q.isPending) return <EditorSkeleton />;
  const topic = q.data?.find((t) => t.id === id);
  if (!topic) return <EditorMissing noun="topic" backHref="/blog/topics" backLabel="All topics" />;
  return <TopicEditor key={topic.id} topic={topic} />;
}
export function TopicNew() { return <TopicEditor key="new" />; }

function TopicEditor({ topic }: { topic?: Topic }) {
  const router = useRouter();
  const all = useTopics().data ?? [];
  const used = useTopicCounts()[topic?.id ?? ''] ?? 0;
  const create = useCreateTopic();
  const update = useUpdateTopic();
  const del = useDeleteTopic();
  const autoSlug = useRef(!topic || topic.slug === slugify(topic.name.en));

  const form = useEditForm<TopicForm>({
    initial: topic ? { name: { ...topic.name }, slug: topic.slug } : { name: { en: '', ro: '' }, slug: '' },
    validate: (v) => validate(v, all.filter((t) => t.id !== topic?.id).map((t) => t.slug)),
    derive: (next, changed) => (changed === 'name.en' && autoSlug.current ? { ...next, slug: slugify(next.name.en) } : next),
    save: (v) => {
      const input = { name: { en: v.name.en.trim(), ro: v.name.ro.trim() }, slug: v.slug.trim() };
      return topic ? update.mutateAsync({ id: topic.id, input }) : create.mutateAsync(input);
    },
    onSaved: (res) => { if (!topic) router.history.replace(`/blog/topics/${(res as Topic).id}`); },
  });

  return (
    <EditorFrame
      form={form}
      title={topic ? topic.name.en : 'New topic'}
      edited={topic ? { by: topic.editedBy, at: topic.editedAt } : null}
      back={{ href: '/blog/topics', label: 'All topics' }}
      remove={topic ? { noun: 'topic', run: () => del.mutateAsync(topic.id), then: '/blog/topics' } : undefined}
    >
      <Section title="Topic">
        <BilingualField name="name" label="Name" hint="Shown on the post list filter and on each post." />
        <SlugField name="slug" label="Slug" hint="Used internally and in filter links. It starts as the English name." onManualEdit={() => { autoSlug.current = false; }} />
        {topic && (
          <p className="blog-by">Used by <b>{countLabel(used)}</b>. Change the order with Reorder in the list.</p>
        )}
        {used > 0 && <Callout>Deleting this topic takes it off {countLabel(used)}. A post left with no topic can’t be published until it gets a new one.</Callout>}
      </Section>
    </EditorFrame>
  );
}
