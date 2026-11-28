import { useQuery } from '@tanstack/react-query';
import { useContentMutation } from '../../../lib/data/hooks';
import { projectsApi } from './api';
import type { ProjectInput } from './types';

/** This module's query keys, so its mutations know what to refresh. */
export const projectKeys = { all: ['projects'] as const };

export function useProjects() {
  return useQuery({ queryKey: projectKeys.all, queryFn: () => projectsApi.list() });
}

// Writes go through useContentMutation: it also refreshes the palette's search and the home activity feed.
export function useCreateProject() {
  return useContentMutation((input: ProjectInput) => projectsApi.create(input), projectKeys.all);
}
export function useUpdateProject() {
  return useContentMutation((a: { id: string; input: ProjectInput }) => projectsApi.update(a.id, a.input), projectKeys.all);
}
export function useDeleteProject() {
  return useContentMutation((id: string) => projectsApi.remove(id), projectKeys.all);
}
export function useReorderProjects() {
  return useContentMutation((ids: string[]) => projectsApi.reorder(ids), projectKeys.all);
}
