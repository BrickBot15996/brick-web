import type { Bilingual, Edited } from '../../../lib/data';

/** Mirrors Project in apps/website/src/lib/projects.ts, plus what the CMS adds (order, who edited). */
export interface ProjectStat { value: string; label: Bilingual }
export interface ProjectFact { label: Bilingual; value: Bilingual }
export interface ProjectPhoto { key: string; width: number; height: number; alt: Bilingual; caption?: Bilingual }
export interface ProjectPartner { name: string; logo?: string; href?: string }
export interface Project extends Edited {
  id: string;
  /** Same in both languages: project names are proper names. Unique. */
  slug: string;
  name: Bilingual;
  /** One sentence: the card text, the page lede and the meta description. */
  summary: Bilingual;
  /** CDN key, null until a logo is uploaded. */
  logo: string | null;
  /** When set the project has no page of its own and its card links here. */
  external: string | null;
  stats: ProjectStat[];
  /** The longer description, one string per paragraph. */
  body: { en: string[]; ro: string[] };
  facts: ProjectFact[];
  photos: ProjectPhoto[];
  partners: ProjectPartner[];
  /** Position in the Projects grid, 0 first. */
  order: number;
}
/** What the editor saves; the data layer fills in id, order and who edited. */
export type ProjectInput = Omit<Project, 'id' | 'order' | 'editedBy' | 'editedAt'>;
