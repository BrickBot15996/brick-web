/**
 * BrickLog posts (CLAUDE.md §3.6), later read from Supabase at build time; bodies are Tiptap JSON rendered to HTML.
 */
import type { Locale } from './site';
import { projects as projectList } from './projects';

/**
 * Tagging model (three facets):
 *  - season:   at most ONE season slug per post (single optional value, never an array).
 *  - topics:   one or more ids from `topics` below.
 *  - projects: zero or more project ids (lib/projects.ts). The project facet stays hidden until a post carries one.
 * CMS validation (future): reject a post with more than one season, with a topic/project id that is not in the
 * managed lists, or with zero topics when publishing. The CMS manages the topic and project lists.
 */
export interface Post {
  slug: Record<Locale, string>;
  title: Record<Locale, string>;
  excerpt: Record<Locale, string>;
  html: Record<Locale, string>;
  date: string;           // ISO
  topics: string[];       // topic ids, at least one
  season?: string;        // exactly zero or one season slug
  projects?: string[];    // project ids
  cover?: { key: string; width: number; height: number };
  sample?: boolean;
}

export interface Tag { id: string; label: Record<Locale, string> }

export const topics: Tag[] = [
  { id: 'competition', label: { en: 'Competition recaps', ro: 'Competiții' } },
  { id: 'engineering', label: { en: 'Engineering', ro: 'Inginerie' } },
  { id: 'programming', label: { en: 'Programming', ro: 'Programare' } },
  { id: 'design', label: { en: 'Design', ro: 'Design' } },
  { id: 'outreach', label: { en: 'Outreach', ro: 'Outreach' } },
  { id: 'sponsors', label: { en: 'Sponsors', ro: 'Sponsori' } },
  { id: 'media', label: { en: 'Media', ro: 'Media' } },
  { id: 'team-life', label: { en: 'Team life', ro: 'Viața în echipă' } },
  { id: 'announcements', label: { en: 'Announcements', ro: 'Anunțuri' } },
];

/** The project tags are the projects themselves (lib/projects.ts). */
export const projects: Tag[] = projectList.map((p) => ({ id: p.id, label: p.name }));

export const topicById = (id: string) => topics.find((t) => t.id === id);
export const projectById = (id: string) => projects.find((t) => t.id === id);

/** No posts yet: the BrickLog page shows its "under construction" state until the CMS publishes the first one. */
export const posts: Post[] = [];

export const readingMinutes = (html: string) => Math.max(1, Math.round(html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length / 200));
