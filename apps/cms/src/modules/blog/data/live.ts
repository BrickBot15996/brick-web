import type { Json } from '@brickbot/supabase';
import { logActivity } from '../../../lib/data/activity';
import { CREATED_BY, EDITED_BY, bilingual, createdBy, sb, toEdited, unwrap } from '../../../lib/data/live-kit';
import { rankSearch } from '../../../lib/data/search';
import type { BlogApi } from './api';
import { emptyDoc, type RichDoc } from './doc';
import { issueSentences, publishIssues } from './rules';
import type { Post, PostInput, Topic } from './types';

type J = NonNullable<Json>;
/** The row of a `.single()` query is never null: a miss throws inside `unwrap`. */

const POST_SELECT = `*, ${EDITED_BY}, ${CREATED_BY}` as const;
const TOPIC_SELECT = `*, ${EDITED_BY}` as const;
const POST_NAMES = { blog_posts_slug_key: 'slug', slug: 'slug' };
const TOPIC_NAMES = { blog_topics_pkey: 'slug', blog_topics_slug_key: 'slug', slug: 'slug' };

type PostRow = {
  id: string; slug: string; title: unknown; excerpt: unknown; body: unknown; cover: string | null; topics: string[]; projects: string[];
  season_id: string | null; status: Post['status']; publish_at: string | null; published_at: string | null; seo: unknown;
  created_at: string; updated_at: string; editor?: { email: string } | null; creator?: { email: string } | null;
};
const doc = (v: unknown): RichDoc => (v && typeof v === 'object' && (v as { type?: unknown }).type === 'doc' ? (v as RichDoc) : emptyDoc());
const mapPost = (r: PostRow): Post => {
  const body = (r.body ?? {}) as { en?: unknown; ro?: unknown };
  const seo = (r.seo ?? {}) as { title?: unknown; description?: unknown };
  return {
    id: r.id, slug: r.slug, title: bilingual(r.title), excerpt: bilingual(r.excerpt), body: { en: doc(body.en), ro: doc(body.ro) },
    cover: r.cover, topics: r.topics, projects: r.projects, season: r.season_id, status: r.status, publishAt: r.publish_at,
    publishedAt: r.published_at, seo: { title: bilingual(seo.title), description: bilingual(seo.description) },
    createdBy: createdBy(r), createdAt: r.created_at, ...toEdited(r),
  };
};
const postColumns = (i: PostInput) => ({
  slug: i.slug, title: i.title as unknown as J, excerpt: i.excerpt as unknown as J, body: i.body as unknown as J,
  cover: i.cover, topics: i.topics, projects: i.projects, season_id: i.season, status: i.status,
  publish_at: i.publishAt, seo: i.seo as unknown as J,
});

/** The same rule the editor shows, enforced before the request. */
function assertPublishable(input: PostInput) {
  if (input.status === 'draft') return;
  const s = issueSentences(publishIssues(input));
  if (s.length) throw new Error(`It can’t go live yet. ${s.join(' ')}`);
  if (input.status === 'scheduled' && !input.publishAt) throw new Error('Pick the time it should go live.');
}
const publishedAt = (input: PostInput, old?: string | null) => (input.status === 'published' ? old ?? new Date().toISOString() : null);

async function slugTaken(slug: string, exceptId?: string) {
  let q = sb().from('blog_posts').select('id').eq('slug', slug);
  if (exceptId) q = q.neq('id', exceptId);
  return (await unwrap(q.limit(1))).length > 0;
}
const postHref = (p: Post) => `/blog/posts/${p.id}`;

type TopicRow = { id: string; slug: string; name: unknown; sort: number; updated_at: string; editor?: { email: string } | null };
const mapTopic = (r: TopicRow): Topic => ({ id: r.id, slug: r.slug, name: bilingual(r.name), order: r.sort, ...toEdited(r) });

async function listPosts(): Promise<Post[]> {
  return (await unwrap(sb().from('blog_posts').select(POST_SELECT).order('created_at', { ascending: false }))).map((r) => mapPost(r as PostRow));
}
async function listTopics(): Promise<Topic[]> {
  return (await unwrap(sb().from('blog_topics').select(TOPIC_SELECT).order('sort').order('created_at'))).map((r) => mapTopic(r as TopicRow));
}
async function topicTaken(slug: string, exceptId?: string) {
  let q = sb().from('blog_topics').select('id').or(`slug.eq.${slug},id.eq.${slug}`);
  if (exceptId) q = q.neq('id', exceptId);
  return (await unwrap(q.limit(1))).length > 0;
}

export const liveBlog: BlogApi = {
  listPosts,
  async createPost(input) {
    if (await slugTaken(input.slug)) throw new Error('Another post already uses that slug.');
    assertPublishable(input);
    const row = await unwrap(sb().from('blog_posts').insert({ ...postColumns(input), published_at: publishedAt(input) }).select(POST_SELECT).single(), POST_NAMES);
    const p = mapPost(row as PostRow);
    logActivity({ action: input.status === 'draft' ? 'saved a draft of' : input.status === 'scheduled' ? 'scheduled post' : 'published post', targetLabel: p.title.en, module: 'Blog', href: postHref(p) });
    return p;
  },
  async updatePost(id, input) {
    const old = await unwrap(sb().from('blog_posts').select('status,published_at').eq('id', id).maybeSingle());
    if (!old) throw new Error('This post no longer exists.');
    if (await slugTaken(input.slug, id)) throw new Error('Another post already uses that slug.');
    assertPublishable(input);
    const row = await unwrap(sb().from('blog_posts').update({ ...postColumns(input), published_at: publishedAt(input, old.published_at) }).eq('id', id).select(POST_SELECT).single(), POST_NAMES);
    const p = mapPost(row as PostRow);
    const oldStatus = old.status;
    const action = input.status === oldStatus ? 'edited post' : input.status === 'published' ? 'published post' : input.status === 'scheduled' ? 'scheduled post' : 'moved to drafts:';
    logActivity({ action, targetLabel: p.title.en, module: 'Blog', href: postHref(p) });
    return p;
  },
  async removePost(id) {
    const old = await unwrap(sb().from('blog_posts').select('title').eq('id', id).maybeSingle());
    if (!old) return;
    await unwrap(sb().from('blog_posts').delete().eq('id', id));
    logActivity({ action: 'deleted post', targetLabel: bilingual(old.title).en, module: 'Blog', href: '/blog/posts' });
  },

  listTopics,
  async createTopic(input) {
    if (await topicTaken(input.slug)) throw new Error('Another topic already uses that slug.');
    const top = await unwrap(sb().from('blog_topics').select('sort').order('sort', { ascending: false }).limit(1));
    const row = await unwrap(sb().from('blog_topics').insert({ id: input.slug, slug: input.slug, name: input.name as unknown as J, sort: (top[0]?.sort ?? -1) + 1 }).select(TOPIC_SELECT).single(), TOPIC_NAMES);
    const t = mapTopic(row as TopicRow);
    logActivity({ action: 'added topic', targetLabel: t.name.en, module: 'Blog', href: `/blog/topics/${t.id}` });
    return t;
  },
  async updateTopic(id, input) {
    const old = await unwrap(sb().from('blog_topics').select('id').eq('id', id).maybeSingle());
    if (!old) throw new Error('This topic no longer exists.');
    if (await topicTaken(input.slug, id)) throw new Error('Another topic already uses that slug.');
    const row = await unwrap(sb().from('blog_topics').update({ slug: input.slug, name: input.name as unknown as J }).eq('id', id).select(TOPIC_SELECT).single(), TOPIC_NAMES);
    const t = mapTopic(row as TopicRow);
    logActivity({ action: 'edited topic', targetLabel: t.name.en, module: 'Blog', href: `/blog/topics/${t.id}` });
    return t;
  },
  async removeTopic(id) {
    const old = await unwrap(sb().from('blog_topics').select('name').eq('id', id).maybeSingle());
    if (!old) return;
    const used = await unwrap(sb().from('blog_posts').select('id').contains('topics', [id]));
    // The database trigger takes the topic off every post.
    await unwrap(sb().from('blog_topics').delete().eq('id', id));
    const rest = await unwrap(sb().from('blog_topics').select('id,sort').order('sort').order('created_at'));
    await Promise.all(rest.map((r, i) => (r.sort === i ? null : unwrap(sb().from('blog_topics').update({ sort: i }).eq('id', r.id)))));
    logActivity({ action: 'deleted topic', targetLabel: bilingual(old.name).en, detail: used.length ? `removed from ${used.length} ${used.length === 1 ? 'post' : 'posts'}` : undefined, module: 'Blog', href: '/blog/topics' });
  },
  async reorderTopics(ids) {
    const all = await unwrap(sb().from('blog_topics').select('id').order('sort'));
    const order = [...ids, ...all.map((r) => r.id).filter((x) => !ids.includes(x))].filter((x) => all.some((r) => r.id === x));
    await Promise.all(order.map((id, sort) => unwrap(sb().from('blog_topics').update({ sort }).eq('id', id))));
    logActivity({ action: 'reordered', targetLabel: 'the blog topics', module: 'Blog', href: '/blog/topics' });
  },

  async search(query) {
    const [posts, topics] = await Promise.all([listPosts(), listTopics()]);
    const status = (p: Post) => p.status[0].toUpperCase() + p.status.slice(1);
    return rankSearch(query, [
      ...posts.map((p) => ({ item: { id: `post-${p.id}`, label: p.title.en, hint: `Post · ${status(p)}`, href: postHref(p) }, text: `${p.title.en} ${p.title.ro} ${p.slug}` })),
      ...topics.map((t) => ({ item: { id: `topic-${t.id}`, label: t.name.en, hint: 'Blog topic', href: `/blog/topics/${t.id}` }, text: `${t.name.en} ${t.name.ro}` })),
    ]);
  },
};
