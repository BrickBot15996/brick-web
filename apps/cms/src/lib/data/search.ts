import { useQuery } from '@tanstack/react-query';
import { can, moduleById } from '../modules';
import type { Session } from './types';

/** A result a module's provider returns. `hint` is the short dimmed context: "Project", "Sponsor · 2025–26". */
export interface SearchItem { id: string; label: string; hint: string; href: string }
/** A result after aggregation: the module that produced it (for its icon). */
export interface SearchHit extends SearchItem { module: string }
/** A module's search. Called with the raw query; return the best few (≤ 5) matches. Use `rankSearch` for the matching. */
export type SearchProvider = (query: string) => SearchItem[] | Promise<SearchItem[]>;

const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

/** Accent- and case-insensitive substring match: label-prefix first, then earliest hit; top 5. `text` is what to match against. */
export function rankSearch<T extends { label: string }>(query: string, items: { item: T; text: string }[], limit = 5): T[] {
  const n = norm(query).trim();
  if (!n) return [];
  return items
    .map(({ item, text }) => ({ item, at: norm(text).indexOf(n), starts: norm(item.label).startsWith(n) }))
    .filter((x) => x.at >= 0)
    .sort((a, b) => Number(b.starts) - Number(a.starts) || a.at - b.at)
    .map((x) => x.item)
    .slice(0, limit);
}

// The module registry hands its providers over once, at load (modules/index.ts). The core never imports the modules.
let providers: { module: string; search: SearchProvider }[] = [];
export function setSearchProviders(list: { module: string; search: SearchProvider }[]): void {
  providers = list;
}

/** Runs every provider whose module the member may use, in registry order. One failing provider does not hide the others. */
async function runSearch(query: string, permissions: readonly string[]): Promise<SearchHit[]> {
  const eligible = providers.filter((p) => { const m = moduleById(p.module); return m && can(permissions, m.requires); });
  const results = await Promise.all(eligible.map(async (p) => {
    try { return (await p.search(query)).map((h): SearchHit => ({ ...h, module: p.module })); } catch { return []; }
  }));
  return results.flat();
}

export const searchKey = (q: string, permissions: readonly string[]) => ['search', q, [...permissions].sort().join(',')] as const;

/** The jump palette's items. Mutations invalidate ['search'] automatically (see useContentMutation). */
export function useSearch(query: string, session: Pick<Session, 'permissions'>) {
  const q = query.trim();
  return useQuery({
    queryKey: searchKey(q, session.permissions),
    queryFn: () => runSearch(q, session.permissions),
    enabled: q.length > 0,
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });
}
