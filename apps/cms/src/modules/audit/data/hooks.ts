import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { auditApi } from './api';
import type { AuditFilters } from './types';

export const auditKeys = { all: ['audit'] as const };

/** The log, one page at a time. `fetchNextPage` loads more. Refetches on mount so other admin writes show up. */
export function useAuditLog(filters: AuditFilters) {
  return useInfiniteQuery({
    queryKey: [...auditKeys.all, 'list', filters] as const,
    queryFn: ({ pageParam }) => auditApi.list(filters, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.next,
    staleTime: 0,
  });
}
export function useAuditActors() {
  return useQuery({ queryKey: [...auditKeys.all, 'actors'] as const, queryFn: () => auditApi.listActors(), staleTime: 60_000 });
}
export function useAuditTables() {
  return useQuery({ queryKey: [...auditKeys.all, 'tables'] as const, queryFn: () => auditApi.listTables(), staleTime: 60_000 });
}
