import { defineApi } from '../../../lib/data/module';
import type { SearchItem } from '../../../lib/data/search';
import { liveTeam } from './live';
import { previewTeam } from './preview';
import type { Impact, ImpactInput, JoinInput, JoinPage, Milestone, MilestoneInput, Mission, MissionInput } from './types';

/** Data contract of Team & story. The in-memory implementation is ./preview.ts; Supabase's will be ./supabase.ts. */
export interface TeamApi {
  listMilestones(): Promise<Milestone[]>;
  createMilestone(input: MilestoneInput): Promise<Milestone>;
  updateMilestone(id: string, input: MilestoneInput): Promise<Milestone>;
  deleteMilestone(id: string): Promise<void>;
  getMission(): Promise<Mission>;
  saveMission(input: MissionInput): Promise<Mission>;
  getImpact(): Promise<Impact>;
  saveImpact(input: ImpactInput): Promise<Impact>;
  getJoin(): Promise<JoinPage>;
  saveJoin(input: JoinInput): Promise<JoinPage>;
  /** Milestones and departments for the jump palette (≤ 5). */
  search(query: string): Promise<SearchItem[]>;
}

export const teamApi = defineApi<TeamApi>({ preview: previewTeam, live: liveTeam });
