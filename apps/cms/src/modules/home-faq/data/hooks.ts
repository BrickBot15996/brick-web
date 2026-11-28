import { useQuery } from '@tanstack/react-query';
import { useContentMutation } from '../../../lib/data/hooks';
import { homeFaqApi } from './api';
import type { FaqInput, Form230Input, HeroInput } from './types';

export const homeFaqKeys = {
  hero: ['home-faq', 'hero'] as const,
  faq: ['home-faq', 'faq'] as const,
  form230: ['home-faq', 'form230'] as const,
};

export const useHero = () => useQuery({ queryKey: homeFaqKeys.hero, queryFn: () => homeFaqApi.getHero() });
export const useFaq = () => useQuery({ queryKey: homeFaqKeys.faq, queryFn: () => homeFaqApi.listFaq() });
export const useForm230 = () => useQuery({ queryKey: homeFaqKeys.form230, queryFn: () => homeFaqApi.getForm230() });

export const useSaveHero = () => useContentMutation((i: HeroInput) => homeFaqApi.saveHero(i), homeFaqKeys.hero);
export const useCreateFaq = () => useContentMutation((i: FaqInput) => homeFaqApi.createFaq(i), homeFaqKeys.faq);
export const useUpdateFaq = () => useContentMutation((a: { id: string; input: FaqInput }) => homeFaqApi.updateFaq(a.id, a.input), homeFaqKeys.faq);
export const useDeleteFaq = () => useContentMutation((id: string) => homeFaqApi.deleteFaq(id), homeFaqKeys.faq);
export const useReorderFaq = () => useContentMutation((ids: string[]) => homeFaqApi.reorderFaq(ids), homeFaqKeys.faq);
export const useSaveForm230 = () => useContentMutation((i: Form230Input) => homeFaqApi.saveForm230(i), homeFaqKeys.form230);
