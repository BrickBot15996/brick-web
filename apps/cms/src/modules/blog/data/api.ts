import { defineApi } from '../../../lib/data/module';
import type { SearchItem } from '../../../lib/data/search';
import { liveBlog } from './live';
import { previewBlog } from './preview';
import type { Post, PostInput, Topic, TopicInput } from './types';

/**
 * The contract of the Blog module's data. Preview: ./preview.ts; Supabase will be ./supabase.ts passed as `live`.
 * A rule-breaking mutation rejects with an Error whose message is safe to show. Every mutation calls `logActivity`.
 */
export interface BlogApi {
  listPosts(): Promise<Post[]>;
  createPost(input: PostInput): Promise<Post>;
  updatePost(id: string, input: PostInput): Promise<Post>;
  removePost(id: string): Promise<void>;
  /** Topics in order. */
  listTopics(): Promise<Topic[]>;
  createTopic(input: TopicInput): Promise<Topic>;
  updateTopic(id: string, input: TopicInput): Promise<Topic>;
  /** Also takes the topic off every post that carries it. */
  removeTopic(id: string): Promise<void>;
  reorderTopics(ids: string[]): Promise<void>;
  /** Posts and topics for the jump palette (≤ 5). */
  search(query: string): Promise<SearchItem[]>;
}

export const blogApi = defineApi<BlogApi>({ preview: previewBlog, live: liveBlog });
