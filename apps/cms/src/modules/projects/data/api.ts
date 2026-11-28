import { defineApi } from '../../../lib/data/module';
import type { SearchItem } from '../../../lib/data/search';
import { liveProjects } from './live';
import { previewProjects } from './preview';
import type { Project, ProjectInput } from './types';

/**
 * The contract of this module's data. The in-memory implementation is ./preview.ts; the Supabase one will be written
 * as ./supabase.ts and passed as `live`. Lists return full records (an editor opens one from the list cache).
 * A mutation that breaks a rule rejects with an Error whose message is safe to show. Every mutation calls `logActivity`.
 */
export interface ProjectsApi {
  /** Projects in grid order. */
  list(): Promise<Project[]>;
  create(input: ProjectInput): Promise<Project>;
  update(id: string, input: ProjectInput): Promise<Project>;
  remove(id: string): Promise<void>;
  /** Sets the grid order to the given ids. */
  reorder(ids: string[]): Promise<void>;
  /** Items for the jump palette (≤ 5). Wired in index.ts as the module's search provider. */
  search(query: string): Promise<SearchItem[]>;
}

export const projectsApi = defineApi<ProjectsApi>({ preview: previewProjects, live: liveProjects });
