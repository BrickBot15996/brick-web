import { useQuery } from '@tanstack/react-query';
import { useContentMutation } from '../../../lib/data/hooks';
import { blogApi } from './api';
import type { PostInput, TopicInput } from './types';

export const blogKeys = { all: ['blog'] as const, posts: ['blog', 'posts'] as const, topics: ['blog', 'topics'] as const };

export function usePosts() {
  return useQuery({ queryKey: blogKeys.posts, queryFn: () => blogApi.listPosts() });
}
export function useTopics() {
  return useQuery({ queryKey: blogKeys.topics, queryFn: () => blogApi.listTopics() });
}

export function useCreatePost() {
  return useContentMutation((input: PostInput) => blogApi.createPost(input), blogKeys.posts);
}
export function useUpdatePost() {
  return useContentMutation((a: { id: string; input: PostInput }) => blogApi.updatePost(a.id, a.input), blogKeys.posts);
}
export function useDeletePost() {
  return useContentMutation((id: string) => blogApi.removePost(id), blogKeys.posts);
}
export function useCreateTopic() {
  return useContentMutation((input: TopicInput) => blogApi.createTopic(input), blogKeys.topics);
}
export function useUpdateTopic() {
  return useContentMutation((a: { id: string; input: TopicInput }) => blogApi.updateTopic(a.id, a.input), blogKeys.topics);
}
/** Deleting a topic also changes posts, so both lists refresh. */
export function useDeleteTopic() {
  return useContentMutation((id: string) => blogApi.removeTopic(id), blogKeys.all);
}
export function useReorderTopics() {
  return useContentMutation((ids: string[]) => blogApi.reorderTopics(ids), blogKeys.topics);
}
