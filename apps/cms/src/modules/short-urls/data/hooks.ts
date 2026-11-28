import { useQuery } from '@tanstack/react-query';
import { useContentMutation } from '../../../lib/data/hooks';
import { shortUrlsApi } from './api';
import type { ShortUrlInput } from './types';

export const shortUrlKeys = { all: ['short-urls'] as const };

export function useShortUrls() {
  return useQuery({ queryKey: shortUrlKeys.all, queryFn: () => shortUrlsApi.list() });
}
export function useCreateShortUrl() {
  return useContentMutation((input: ShortUrlInput) => shortUrlsApi.create(input), shortUrlKeys.all);
}
export function useUpdateShortUrl() {
  return useContentMutation((a: { slug: string; input: ShortUrlInput }) => shortUrlsApi.update(a.slug, a.input), shortUrlKeys.all);
}
export function useDeleteShortUrl() {
  return useContentMutation((slug: string) => shortUrlsApi.remove(slug), shortUrlKeys.all);
}
