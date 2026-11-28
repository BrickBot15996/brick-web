import { useQuery } from '@tanstack/react-query';
import { useContentMutation } from '../../../lib/data/hooks';
import { galleryApi } from './api';
import type { GalleryBulkPatch, GalleryInput } from './types';

/** This module's query keys, so its mutations know what to refresh. */
export const galleryKeys = { all: ['gallery'] as const };

export function useGallery() {
  return useQuery({ queryKey: galleryKeys.all, queryFn: () => galleryApi.list() });
}

// Writes go through useContentMutation: it also refreshes the palette's search and the home activity feed.
export function useCreateGalleryItem() {
  return useContentMutation((input: GalleryInput) => galleryApi.create(input), galleryKeys.all);
}
export function useCreateGalleryItems() {
  return useContentMutation((inputs: GalleryInput[]) => galleryApi.createMany(inputs), galleryKeys.all);
}
export function useUpdateGalleryItem() {
  return useContentMutation((a: { id: string; input: GalleryInput }) => galleryApi.update(a.id, a.input), galleryKeys.all);
}
export function useDeleteGalleryItem() {
  return useContentMutation((id: string) => galleryApi.remove(id), galleryKeys.all);
}
export function useDeleteGalleryItems() {
  return useContentMutation((ids: string[]) => galleryApi.removeMany(ids), galleryKeys.all);
}
export function useBulkGallery() {
  return useContentMutation((a: { ids: string[]; patch: GalleryBulkPatch }) => galleryApi.bulk(a.ids, a.patch), galleryKeys.all);
}
