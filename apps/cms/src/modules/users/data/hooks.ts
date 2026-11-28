import { useQuery } from '@tanstack/react-query';
import { useContentMutation } from '../../../lib/data/hooks';
import { adminApi } from './api';
import type { InviteInput, PermissionChange } from './types';

/** Users, permissions and the catalog share these keys: any admin write refreshes all of them. */
export const usersKeys = {
  all: ['users'] as const,
  list: ['users', 'list'] as const,
  catalog: ['users', 'catalog'] as const,
};
const writes = [usersKeys.list, ['audit']];

export function useAdminUsers() {
  return useQuery({ queryKey: usersKeys.list, queryFn: () => adminApi.listUsers() });
}
export function useCatalog() {
  return useQuery({ queryKey: usersKeys.catalog, queryFn: () => adminApi.listCatalog(), staleTime: 5 * 60_000 });
}

export function useInvite() {
  return useContentMutation((i: InviteInput) => adminApi.invite(i), writes);
}
export function useResendInvite() {
  return useContentMutation((id: string) => adminApi.resendInvite(id), writes);
}
export function useDeactivate() {
  return useContentMutation((id: string) => adminApi.deactivate(id), writes);
}
export function useReactivate() {
  return useContentMutation((id: string) => adminApi.reactivate(id), writes);
}
export function useSetPermissions() {
  return useContentMutation((c: PermissionChange[]) => adminApi.setPermissions(c), writes);
}
