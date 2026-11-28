import type { PostInput } from './types';
import { isEmptyDoc } from './doc';

/** What stops a post from going live. Shared by the editor and the preview data layer. */
export interface PublishIssues { en: string[]; ro: string[]; topics: boolean }

export function publishIssues(p: Pick<PostInput, 'title' | 'excerpt' | 'body' | 'topics'>): PublishIssues {
  const lang = (l: 'en' | 'ro') => {
    const out: string[] = [];
    if (!p.title[l].trim()) out.push('title');
    if (!p.excerpt[l].trim()) out.push('excerpt');
    if (isEmptyDoc(p.body[l])) out.push('body');
    return out;
  };
  return { en: lang('en'), ro: lang('ro'), topics: p.topics.length === 0 };
}

const list = (a: string[]) => (a.length <= 1 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);

/** One plain sentence per problem, or an empty array when the post is ready. */
export function issueSentences(i: PublishIssues): string[] {
  const out: string[] = [];
  if (i.en.length) out.push(`English ${list(i.en)} ${i.en.length === 1 ? 'is' : 'are'} empty.`);
  if (i.ro.length) out.push(`Romanian ${list(i.ro)} ${i.ro.length === 1 ? 'is' : 'are'} empty.`);
  if (i.topics) out.push('Pick at least one topic.');
  return out;
}
