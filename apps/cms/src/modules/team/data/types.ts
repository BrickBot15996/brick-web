import type { Bilingual, Edited } from '../../../lib/data';

/** One entry of the Our Story timeline. `when` is "YYYY", "YYYY-MM" or "YYYY-MM-DD" (it sorts as text). */
export interface Milestone extends Edited {
  id: string;
  when: string;
  title: Bilingual;
  text: Bilingual;
  /** CDN key under site/story/timeline/, or null. */
  image: string | null;
}
export type MilestoneInput = Omit<Milestone, 'id' | 'editedBy' | 'editedAt'>;

export interface Value { name: Bilingual; line: Bilingual }
/** The Team page copy. Bodies are markdown. */
export interface Mission extends Edited {
  mission: Bilingual;
  drive: Bilingual;
  values: Value[];
  studentsDo: Bilingual;
  teamPhoto: string | null;
}
export type MissionInput = Omit<Mission, 'editedBy' | 'editedAt'>;

/** A manually entered impact number (home page and Our Story). `id` is fixed. */
export interface ImpactNumber { id: 'years' | 'awards' | 'reached' | 'events'; value: number | null; suffix: string; label: Bilingual }
export interface Impact extends Edited { numbers: ImpactNumber[] }
export type ImpactInput = Pick<Impact, 'numbers'>;

export interface DepartmentPhoto { file: string; alt: Bilingual }
export interface Department {
  /** Fixed slug, also the CDN folder: site/join/{id}/. */
  id: string;
  name: Bilingual;
  description: Bilingual;
  photos: DepartmentPhoto[];
}
export interface JoinPage extends Edited {
  requirements: Bilingual;
  departments: Department[];
}
export type JoinInput = Pick<JoinPage, 'requirements' | 'departments'>;
