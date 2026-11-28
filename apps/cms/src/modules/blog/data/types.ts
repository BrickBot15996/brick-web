import type { Bilingual, Edited } from '../../../lib/data';
import type { RichDoc } from './doc';

export type PostStatus = 'draft' | 'scheduled' | 'published';

/**
 * Mirrors Post in apps/website/src/lib/blog.ts (title, excerpt, body, topics, season, projects, cover), plus what the CMS
 * adds: status, schedule, SEO overrides, authorship. The website keeps one slug per language; the CMS starts with one
 * shared slug (see the report). `body` is Tiptap JSON, rendered to HTML at build time.
 */
export interface Post extends Edited {
  id: string;
  /** Unique; derived from the English title until edited. */
  slug: string;
  title: Bilingual;
  excerpt: Bilingual;
  body: { en: RichDoc; ro: RichDoc };
  /** CDN key under blog/{slug}/, or null. */
  cover: string | null;
  /** Topic ids; at least one to publish. */
  topics: string[];
  /** Project ids (the projects module's ids); may be empty. */
  projects: string[];
  /** At most one season id (§11 slug), null for none. */
  season: string | null;
  status: PostStatus;
  /** ISO instant, set while status is "scheduled". */
  publishAt: string | null;
  /** ISO instant the post went live in the CMS; the website's date. Null until published. */
  publishedAt: string | null;
  seo: { title: Bilingual; description: Bilingual };
  createdBy: string;
  createdAt: string;
}
/** What the editor saves; the data layer fills in id, publishedAt, createdBy/At and who edited. */
export type PostInput = Omit<Post, 'id' | 'publishedAt' | 'createdBy' | 'createdAt' | 'editedBy' | 'editedAt'>;

export interface Topic extends Edited {
  /** Stable reference used by posts and the website. Equals the slug at creation. */
  id: string;
  slug: string;
  name: Bilingual;
  order: number;
}
export type TopicInput = Pick<Topic, 'slug' | 'name'>;
