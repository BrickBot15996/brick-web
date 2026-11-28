import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { QueryKey } from '@tanstack/react-query';
import { cms } from './index';
import type { PublishTarget } from './types';

/** Core query keys. A module keeps its own keys in its own data/hooks.ts, as `['<module>', ...]`. */
export const keys = {
  session: ['session'] as const,
  activity: ['activity'] as const,
  publish: ['publish-status'] as const,
  seasons: ['seasons'] as const,
};

export function useSession() {
  return useQuery({ queryKey: keys.session, queryFn: () => cms.getSession(), staleTime: Infinity, retry: false });
}

export function useActivity() {
  return useQuery({ queryKey: keys.activity, queryFn: () => cms.listActivity(), staleTime: 30_000 });
}

/** Polls while a build runs, so the status flips to live on its own. */
export function usePublishStatus() {
  return useQuery({
    queryKey: keys.publish,
    queryFn: () => cms.getPublishStatus(),
    refetchInterval: (q) => (q.state.data?.state === 'building' ? 1500 : false),
  });
}

export function usePublish() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (targets: PublishTarget[]) => cms.publish(targets),
    onSuccess: (status) => {
      qc.setQueryData(keys.publish, status);
      // The finished build lands in the activity feed a few seconds later.
      setTimeout(() => qc.invalidateQueries({ queryKey: keys.activity }), 7000);
    },
  });
}

export function useSeasons() {
  return useQuery({ queryKey: keys.seasons, queryFn: () => cms.listSeasons(), staleTime: 5 * 60_000 });
}

/**
 * The one way a module writes. Wraps `useMutation` so that after a successful write the module's own query keys, the
 * palette's search and the home activity feed are all refreshed, without the module having to remember them:
 *
 *   const update = useContentMutation((a: { id: string; input: ProjectInput }) => projectsApi.update(a.id, a.input), projectKeys.all);
 *
 * `invalidate` is one key or a list of keys (prefix match, like React Query). Extra `onSuccess` work goes in `opts`.
 */
export function useContentMutation<V, R = unknown>(
  mutationFn: (variables: V) => Promise<R>,
  invalidate: QueryKey | QueryKey[],
  opts?: { onSuccess?: (result: R, variables: V) => void },
) {
  const qc = useQueryClient();
  const list: QueryKey[] = Array.isArray(invalidate[0]) ? (invalidate as QueryKey[]) : [invalidate as QueryKey];
  return useMutation({
    mutationFn,
    onSuccess: async (result: R, variables: V) => {
      await Promise.all([...list, ['search'] as const, keys.activity, keys.publish].map((k) => qc.invalidateQueries({ queryKey: k })));
      opts?.onSuccess?.(result, variables);
    },
  });
}
