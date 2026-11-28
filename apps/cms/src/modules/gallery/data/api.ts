import { defineApi } from '../../../lib/data/module';
import type { SearchItem } from '../../../lib/data/search';
import { liveGallery } from './live';
import { previewGallery } from './preview';
import type { GalleryBulkPatch, GalleryInput, GalleryItem } from './types';

/**
 * The contract of this module's data. The in-memory implementation is ./preview.ts; the Supabase one will be written as
 * ./supabase.ts and passed as `live`. Lists return full records. A mutation that breaks a rule rejects with an Error
 * whose message is safe to show. Every mutation calls `logActivity`. Files are not touched here: the Media library owns
 * upload and delete, and deleting a gallery item leaves its file in the bucket.
 */
export interface GalleryApi {
  /** Every item, most recently edited first. */
  list(): Promise<GalleryItem[]>;
  create(input: GalleryInput): Promise<GalleryItem>;
  /** One write for many (bulk upload). */
  createMany(inputs: GalleryInput[]): Promise<GalleryItem[]>;
  update(id: string, input: GalleryInput): Promise<GalleryItem>;
  remove(id: string): Promise<void>;
  removeMany(ids: string[]): Promise<void>;
  /** Sets season and/or featured on many items. */
  bulk(ids: string[], patch: GalleryBulkPatch): Promise<void>;
  search(query: string): Promise<SearchItem[]>;
}

export const galleryApi = defineApi<GalleryApi>({ preview: previewGallery, live: liveGallery });
