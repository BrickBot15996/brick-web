import { logActivity } from '../../../lib/data/activity';
import { rankSearch } from '../../../lib/data/search';
import { nowIso, PREVIEW_ME as ME, previewDelay, previewFailSave } from '../../../lib/data/preview-kit';
import type { BlogApi } from './api';
import { issueSentences, publishIssues } from './rules';
import { posts as postSeed, topics as topicSeed } from './seed';
import type { Post, PostInput, Topic } from './types';

// The preview database. It lives in memory, so a reload starts again from the seed.
let posts: Post[] = postSeed.map((x) => ({ ...x }));
let topics: Topic[] = topicSeed.map((x) => ({ ...x }));

const postHref = (p: Post) => `/blog/posts/${p.id}`;

/** The same rule the editor shows, enforced where the data lives. */
function assertPublishable(input: PostInput) {
  if (input.status === 'draft') return;
  const s = issueSentences(publishIssues(input));
  if (s.length) throw new Error(`It can’t go live yet. ${s.join(' ')}`);
  if (input.status === 'scheduled' && !input.publishAt) throw new Error('Pick the time it should go live.');
}

function settle(input: PostInput, old?: Post): Pick<Post, 'publishedAt'> {
  if (input.status === 'published') return { publishedAt: old?.publishedAt ?? nowIso() };
  return { publishedAt: null };
}

export const previewBlog: BlogApi = {
  async listPosts() { await previewDelay(); return [...posts]; },
  async createPost(input) {
    await previewDelay();
    previewFailSave();
    if (posts.some((p) => p.slug === input.slug)) throw new Error('Another post already uses that slug.');
    assertPublishable(input);
    const now = nowIso();
    const p: Post = { ...input, id: input.slug, ...settle(input), createdBy: ME, createdAt: now, editedBy: ME, editedAt: now };
    posts = [p, ...posts];
    logActivity({ action: input.status === 'draft' ? 'saved a draft of' : input.status === 'scheduled' ? 'scheduled post' : 'published post', targetLabel: p.title.en, module: 'Blog', href: postHref(p) });
    return p;
  },
  async updatePost(id, input) {
    await previewDelay();
    previewFailSave();
    const old = posts.find((p) => p.id === id);
    if (!old) throw new Error('This post no longer exists.');
    if (posts.some((p) => p.id !== id && p.slug === input.slug)) throw new Error('Another post already uses that slug.');
    assertPublishable(input);
    const p: Post = { ...old, ...input, ...settle(input, old), editedBy: ME, editedAt: nowIso() };
    posts = posts.map((x) => (x.id === id ? p : x));
    const action = input.status === old.status ? 'edited post' : input.status === 'published' ? 'published post' : input.status === 'scheduled' ? 'scheduled post' : 'moved to drafts:';
    logActivity({ action, targetLabel: p.title.en, module: 'Blog', href: postHref(p) });
    return p;
  },
  async removePost(id) {
    await previewDelay();
    const old = posts.find((p) => p.id === id);
    if (!old) return;
    posts = posts.filter((p) => p.id !== id);
    logActivity({ action: 'deleted post', targetLabel: old.title.en, module: 'Blog', href: '/blog/posts' });
  },

  async listTopics() { await previewDelay(); return [...topics].sort((a, b) => a.order - b.order); },
  async createTopic(input) {
    await previewDelay();
    previewFailSave();
    if (topics.some((t) => t.slug === input.slug || t.id === input.slug)) throw new Error('Another topic already uses that slug.');
    const t: Topic = { ...input, id: input.slug, order: Math.max(-1, ...topics.map((x) => x.order)) + 1, editedBy: ME, editedAt: nowIso() };
    topics = [...topics, t];
    logActivity({ action: 'added topic', targetLabel: t.name.en, module: 'Blog', href: `/blog/topics/${t.id}` });
    return t;
  },
  async updateTopic(id, input) {
    await previewDelay();
    previewFailSave();
    const old = topics.find((t) => t.id === id);
    if (!old) throw new Error('This topic no longer exists.');
    if (topics.some((t) => t.id !== id && t.slug === input.slug)) throw new Error('Another topic already uses that slug.');
    const t: Topic = { ...old, ...input, editedBy: ME, editedAt: nowIso() };
    topics = topics.map((x) => (x.id === id ? t : x));
    logActivity({ action: 'edited topic', targetLabel: t.name.en, module: 'Blog', href: `/blog/topics/${t.id}` });
    return t;
  },
  async removeTopic(id) {
    await previewDelay();
    const old = topics.find((t) => t.id === id);
    if (!old) return;
    const used = posts.filter((p) => p.topics.includes(id)).length;
    topics = topics.filter((t) => t.id !== id).sort((a, b) => a.order - b.order).map((t, order) => ({ ...t, order }));
    posts = posts.map((p) => (p.topics.includes(id) ? { ...p, topics: p.topics.filter((x) => x !== id) } : p));
    logActivity({ action: 'deleted topic', targetLabel: old.name.en, detail: used ? `removed from ${used} ${used === 1 ? 'post' : 'posts'}` : undefined, module: 'Blog', href: '/blog/topics' });
  },
  async reorderTopics(ids) {
    await previewDelay();
    topics = topics.map((t) => ({ ...t, order: ids.indexOf(t.id) })).sort((a, b) => a.order - b.order);
    logActivity({ action: 'reordered', targetLabel: 'the blog topics', module: 'Blog', href: '/blog/topics' });
  },

  async search(query) {
    await previewDelay(60);
    const status = (p: Post) => p.status[0].toUpperCase() + p.status.slice(1);
    return rankSearch(query, [
      ...posts.map((p) => ({ item: { id: `post-${p.id}`, label: p.title.en, hint: `Post · ${status(p)}`, href: postHref(p) }, text: `${p.title.en} ${p.title.ro} ${p.slug}` })),
      ...topics.map((t) => ({ item: { id: `topic-${t.id}`, label: t.name.en, hint: 'Blog topic', href: `/blog/topics/${t.id}` }, text: `${t.name.en} ${t.name.ro}` })),
    ]);
  },
};
