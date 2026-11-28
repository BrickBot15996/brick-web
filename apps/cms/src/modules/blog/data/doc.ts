/** Tiptap JSON helpers: no editor needed, so the data layer and the list can use them too. */
export interface RichNode { type: string; attrs?: Record<string, unknown>; content?: RichNode[]; marks?: { type: string; attrs?: Record<string, unknown> }[]; text?: string }
export interface RichDoc { type: 'doc'; content?: RichNode[] }

export const emptyDoc = (): RichDoc => ({ type: 'doc', content: [{ type: 'paragraph' }] });

const BLOCKS = new Set(['paragraph', 'heading', 'blockquote', 'listItem', 'bulletList', 'orderedList']);

/** The plain text of a document, blocks separated by a space. */
export function docText(doc: RichDoc | RichNode | null | undefined): string {
  if (!doc) return '';
  const out: string[] = [];
  const walk = (n: RichNode) => {
    if (n.text) out.push(n.text);
    n.content?.forEach(walk);
    if (BLOCKS.has(n.type)) out.push(' ');
  };
  walk(doc as RichNode);
  return out.join('').replace(/\s+/g, ' ').trim();
}

export const wordCount = (doc: RichDoc | null | undefined) => { const t = docText(doc); return t ? t.split(' ').length : 0; };

/** True when a document has no text and no image. */
export function isEmptyDoc(doc: RichDoc | null | undefined): boolean {
  if (!doc) return true;
  let image = false;
  const walk = (n: RichNode) => { if (n.type === 'image') image = true; n.content?.forEach(walk); };
  walk(doc as RichNode);
  return !image && docText(doc) === '';
}

/** Minutes to read at 200 words a minute; 0 for an empty body, otherwise at least 1 (the website does the same). */
export const readingMinutes = (doc: RichDoc | null | undefined) => { const w = wordCount(doc); return w === 0 ? 0 : Math.max(1, Math.round(w / 200)); };
