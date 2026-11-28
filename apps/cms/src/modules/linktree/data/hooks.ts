import { useQuery } from '@tanstack/react-query';
import { useContentMutation } from '../../../lib/data/hooks';
import { linktreeApi } from './api';
import type { LinktreeInput } from './types';

export const linktreeKeys = { all: ['linktree'] as const };

export function useLinktree() {
  return useQuery({ queryKey: linktreeKeys.all, queryFn: () => linktreeApi.get() });
}
export function useSaveLinktree() {
  return useContentMutation((input: LinktreeInput) => linktreeApi.save(input), linktreeKeys.all);
}
