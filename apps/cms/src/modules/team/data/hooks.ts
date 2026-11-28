import { useQuery } from '@tanstack/react-query';
import { useContentMutation } from '../../../lib/data/hooks';
import { teamApi } from './api';
import type { ImpactInput, JoinInput, MilestoneInput, MissionInput } from './types';

export const teamKeys = {
  milestones: ['team', 'milestones'] as const,
  mission: ['team', 'mission'] as const,
  impact: ['team', 'impact'] as const,
  join: ['team', 'join'] as const,
};

export const useMilestones = () => useQuery({ queryKey: teamKeys.milestones, queryFn: () => teamApi.listMilestones() });
export const useMission = () => useQuery({ queryKey: teamKeys.mission, queryFn: () => teamApi.getMission() });
export const useImpact = () => useQuery({ queryKey: teamKeys.impact, queryFn: () => teamApi.getImpact() });
export const useJoinPage = () => useQuery({ queryKey: teamKeys.join, queryFn: () => teamApi.getJoin() });

export const useCreateMilestone = () => useContentMutation((i: MilestoneInput) => teamApi.createMilestone(i), teamKeys.milestones);
export const useUpdateMilestone = () => useContentMutation((a: { id: string; input: MilestoneInput }) => teamApi.updateMilestone(a.id, a.input), teamKeys.milestones);
export const useDeleteMilestone = () => useContentMutation((id: string) => teamApi.deleteMilestone(id), teamKeys.milestones);
export const useSaveMission = () => useContentMutation((i: MissionInput) => teamApi.saveMission(i), teamKeys.mission);
export const useSaveImpact = () => useContentMutation((i: ImpactInput) => teamApi.saveImpact(i), teamKeys.impact);
export const useSaveJoin = () => useContentMutation((i: JoinInput) => teamApi.saveJoin(i), teamKeys.join);
