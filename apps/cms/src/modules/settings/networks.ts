import type { Network } from './data/types';

/** Display names, in the order of the CLAUDE.md §4 table (the seed order). */
export const NETWORKS: { id: Network; label: string; hint: string }[] = [
  { id: 'website', label: 'Website', hint: 'https://brickbot.ro/en' },
  { id: 'instagram', label: 'Instagram', hint: 'https://instagram.com/…' },
  { id: 'facebook', label: 'Facebook', hint: 'https://facebook.com/…' },
  { id: 'tiktok', label: 'TikTok', hint: 'https://tiktok.com/@…' },
  { id: 'linkedin', label: 'LinkedIn', hint: 'https://linkedin.com/company/…' },
  { id: 'email', label: 'Email', hint: 'mailto:contact@brickbot.ro' },
  { id: 'youtube', label: 'YouTube', hint: 'https://youtube.com/channel/…' },
  { id: 'github', label: 'GitHub', hint: 'https://github.com/…' },
];
export const networkLabel = (id: Network) => NETWORKS.find((n) => n.id === id)?.label ?? id;
