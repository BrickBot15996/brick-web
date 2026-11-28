import { useQuery } from '@tanstack/react-query';
import { useContentMutation } from '../../../lib/data/hooks';
import { pressApi } from './api';
import type { PressKitInput } from './types';

export const pressKeys = { kit: ['press', 'kit'] as const };

export const usePressKit = () => useQuery({ queryKey: pressKeys.kit, queryFn: () => pressApi.get() });
export const useSavePressKit = () => useContentMutation((i: PressKitInput) => pressApi.save(i), pressKeys.kit);
