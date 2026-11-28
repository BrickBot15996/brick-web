import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import type { Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { mediaUrl } from '../../lib/data/media';
import { isUrl } from '../../lib/format';
import { getPath, useForm } from '../../lib/form';
import { Icon } from '../../components/icons';
import { Dialog, fid, MediaPicker } from '../../components/edit';
import { emptyDoc } from './data/doc';
import type { RichDoc } from './data/doc';

/** Tiptap's image node, plus the CDN key the website needs (the src is only for showing it here). */
const PostImage = Image.extend({
  addAttributes() { return { ...this.parent?.(), key: { default: null } }; },
});

const extensions = [
  StarterKit.configure({
    heading: { levels: [2, 3] },
    link: { openOnClick: false, autolink: false, HTMLAttributes: { rel: 'noopener noreferrer' } },
    underline: false, strike: false, code: false, codeBlock: false,
  }),
  PostImage.configure({ inline: false }),
];

// Same 1.8-stroke, 24-grid style as components/icons. Local to the blog module: the shared set has no editor glyphs.
const GLYPHS = {
  bold: 'M7 4h6a3.5 3.5 0 0 1 0 7H7ZM7 11h7.5a3.5 3.5 0 0 1 0 7H7Z',
  italic: 'M19 4h-9M14 20H5M15 4 9 20',
  bullets: 'M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01',
  numbers: 'M10 6h11M10 12h11M10 18h11M4 5l1.5-1v5M4 14.5a1.5 1.5 0 1 1 3 .6L4 18h3',
  quote: 'M4 5v14M9 8h11M9 12h11M9 16h7',
  rule: 'M3 12h18M6 6.5h4M14 6.5h4M6 17.5h4M14 17.5h4',
  undo: 'M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  redo: 'm15 14 5-5-5-5M20 9H10a6 6 0 0 0 0 12h3',
} as const;
function Glyph({ name }: { name: keyof typeof GLYPHS }) {
  return <svg className="i" viewBox="0 0 24 24" aria-hidden="true"><path d={GLYPHS[name]} /></svg>;
}

type Tool = { id: string; label: string; icon: ReactNode; active?: boolean; disabled?: boolean; run: () => void };

/**
 * One rich-text field of a post, stored as Tiptap JSON under `name` ("body.en"). The surface is an outlined squircle like
 * the inputs; the toolbar is a roving-tabindex row of icon buttons (arrows move, Tab leaves).
 */
export function RichText({ name, label, folders }: { name: string; label: string; folders: string[] }) {
  const form = useForm();
  const value = (getPath(form.values, name) as RichDoc | undefined) ?? emptyDoc();
  const [linkOpen, setLinkOpen] = useState(false);
  const [pickOpen, setPickOpen] = useState(false);

  const editor = useEditor({
    extensions,
    content: value,
    editorProps: { attributes: { class: 'blog-prose', role: 'textbox', 'aria-multiline': 'true', 'aria-label': label, id: fid(name), spellcheck: 'true' } },
    onUpdate: ({ editor: e }) => form.set(name, e.getJSON()),
    onBlur: () => form.blur(name),
  });

  // Follow the form when it changes under the editor (Discard), but not for the editor's own edits.
  useEffect(() => {
    if (!editor) return;
    if (JSON.stringify(editor.getJSON()) !== JSON.stringify(value)) editor.commands.setContent(value, { emitUpdate: false });
  }, [editor, value]);

  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => e ? {
      h2: e.isActive('heading', { level: 2 }), h3: e.isActive('heading', { level: 3 }), bold: e.isActive('bold'), italic: e.isActive('italic'),
      link: e.isActive('link'), ul: e.isActive('bulletList'), ol: e.isActive('orderedList'), quote: e.isActive('blockquote'),
      undo: e.can().undo(), redo: e.can().redo(),
      img: e.isActive('image'), alt: (e.getAttributes('image').alt as string | undefined) ?? '',
    } : null,
  });

  if (!editor) return <div className="blog-rt skeleton" style={{ minHeight: 280 }} aria-hidden="true" />;

  const tools: (Tool | 'sep')[] = [
    { id: 'h2', label: 'Heading 2', icon: <span className="blog-tb__txt">H2</span>, active: s?.h2, run: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { id: 'h3', label: 'Heading 3', icon: <span className="blog-tb__txt">H3</span>, active: s?.h3, run: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    'sep',
    { id: 'bold', label: 'Bold', icon: <Glyph name="bold" />, active: s?.bold, run: () => editor.chain().focus().toggleBold().run() },
    { id: 'italic', label: 'Italic', icon: <Glyph name="italic" />, active: s?.italic, run: () => editor.chain().focus().toggleItalic().run() },
    { id: 'link', label: 'Link', icon: <Icon name="link" />, active: s?.link, run: () => setLinkOpen(true) },
    'sep',
    { id: 'ul', label: 'Bulleted list', icon: <Glyph name="bullets" />, active: s?.ul, run: () => editor.chain().focus().toggleBulletList().run() },
    { id: 'ol', label: 'Numbered list', icon: <Glyph name="numbers" />, active: s?.ol, run: () => editor.chain().focus().toggleOrderedList().run() },
    'sep',
    { id: 'image', label: 'Image from media library', icon: <Icon name="gallery" />, run: () => setPickOpen(true) },
    'sep',
    { id: 'undo', label: 'Undo', icon: <Glyph name="undo" />, disabled: !s?.undo, run: () => editor.chain().focus().undo().run() },
    { id: 'redo', label: 'Redo', icon: <Glyph name="redo" />, disabled: !s?.redo, run: () => editor.chain().focus().redo().run() },
    'sep',
    { id: 'quote', label: 'Quote', icon: <Glyph name="quote" />, active: s?.quote, run: () => editor.chain().focus().toggleBlockquote().run() },
    { id: 'rule', label: 'Horizontal rule', icon: <Glyph name="rule" />, run: () => editor.chain().focus().setHorizontalRule().run() },
  ];

  return (
    <div className="blog-rt">
      <Toolbar label={`${label} formatting`} tools={tools} />
      {s?.img && <AltBar editor={editor} alt={s.alt} lang={label} />}
      <EditorContent editor={editor} />
      {linkOpen && createPortal(<LinkDialog editor={editor} onClose={() => { setLinkOpen(false); editor.commands.focus(); }} />, document.body)}
      {pickOpen && createPortal(
        <MediaPicker prefixes={folders} kinds={['image', 'svg']} current={null} tile="dark" onClose={() => setPickOpen(false)}
          onPick={(key) => {
            const alt = (key.split('/').pop() ?? '').replace(/\.[a-z0-9]+$/i, '').replace(/[-_.]+/g, ' ');
            editor.chain().focus().insertContent({ type: 'image', attrs: { src: mediaUrl(key), alt, key } }).run();
            setPickOpen(false);
          }} />, document.body)}
    </div>
  );
}

const BTN = 32, SEP = 7, PAD = 12;

/** The toolbar is one row: tools that do not fit move, last first, into a "More" menu. */
function Toolbar({ label, tools }: { label: string; tools: (Tool | 'sep')[] }) {
  const root = useRef<HTMLDivElement>(null);
  const [roving, setRoving] = useState(0);
  const [width, setWidth] = useState(10_000);
  const [menu, setMenu] = useState(false);
  const moreBtn = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  // How many tools fit before "More" is needed.
  const flat = tools.filter((t): t is Tool => t !== 'sep');
  const full = flat.length * BTN + (tools.length - flat.length) * SEP + PAD;
  let shown: (Tool | 'sep')[] = tools;
  let hidden: Tool[] = [];
  if (full > width) {
    let used = PAD + BTN; // room for More
    let cut = 0;
    for (; cut < tools.length; cut++) {
      const w = tools[cut] === 'sep' ? SEP : BTN;
      if (used + w > width) break;
      used += w;
    }
    shown = tools.slice(0, cut);
    while (shown.length && shown[shown.length - 1] === 'sep') shown = shown.slice(0, -1);
    hidden = tools.slice(cut).filter((t): t is Tool => t !== 'sep');
  }
  const buttons = shown.filter((t): t is Tool => t !== 'sep');
  const overflow = hidden.length > 0;
  const total = buttons.length + (overflow ? 1 : 0);
  const rv = Math.min(roving, Math.max(total - 1, 0));

  useEffect(() => { if (!overflow) setMenu(false); }, [overflow]);
  useEffect(() => {
    if (!menu) return;
    menuRef.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
    const down = (e: PointerEvent) => { if (!menuRef.current?.contains(e.target as Node) && !moreBtn.current?.contains(e.target as Node)) setMenu(false); };
    document.addEventListener('pointerdown', down);
    return () => document.removeEventListener('pointerdown', down);
  }, [menu]);

  const key = (e: KeyboardEvent) => {
    const all = Array.from(root.current?.querySelectorAll<HTMLButtonElement>('.blog-tb__row button:not(:disabled)') ?? []);
    const i = all.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    let to = -1;
    if (e.key === 'ArrowRight') to = (i + 1) % all.length;
    else if (e.key === 'ArrowLeft') to = (i - 1 + all.length) % all.length;
    else if (e.key === 'Home') to = 0;
    else if (e.key === 'End') to = all.length - 1;
    if (to < 0) return;
    e.preventDefault();
    all[to].focus();
  };
  const menuKey = (e: KeyboardEvent) => {
    const all = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []);
    const i = all.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setMenu(false); moreBtn.current?.focus(); }
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); all[(i + (e.key === 'ArrowDown' ? 1 : -1) + all.length) % all.length]?.focus(); }
    else if (e.key === 'Tab') setMenu(false);
  };

  return (
    <div className="blog-tb" ref={root} onKeyDown={key}>
      <div className="blog-tb__row" role="toolbar" aria-label={label}>
        {shown.map((t, n) => {
          if (t === 'sep') return <span key={`s${n}`} className="blog-tb__sep" aria-hidden="true" />;
          const idx = buttons.indexOf(t);
          return (
            <button key={t.id} type="button" data-id={t.id} className="blog-tb__btn" aria-label={t.label} title={t.label} aria-pressed={t.active === undefined ? undefined : t.active}
              disabled={t.disabled} tabIndex={idx === rv ? 0 : -1} onFocus={() => setRoving(idx)}
              onMouseDown={(e) => e.preventDefault()} onClick={t.run}>
              {t.icon}
            </button>
          );
        })}
        {overflow && (
          <button ref={moreBtn} type="button" className="blog-tb__btn" aria-label="More formatting" title="More" aria-haspopup="true" aria-expanded={menu} tabIndex={rv === buttons.length ? 0 : -1}
            onFocus={() => setRoving(buttons.length)} onMouseDown={(e) => e.preventDefault()} onClick={() => setMenu((v) => !v)}>
            <Glyph name="more" />
          </button>
        )}
      </div>
      {menu && overflow && (
        <div className="blog-tb__menu" ref={menuRef} role="group" aria-label="More formatting" onKeyDown={menuKey}>
          {hidden.map((t) => (
            <button key={t.id} type="button" className="blog-tb__item" aria-pressed={t.active === undefined ? undefined : t.active} disabled={t.disabled}
              onMouseDown={(e) => e.preventDefault()} onClick={() => { setMenu(false); t.run(); }}>
              <span className="blog-tb__ico" aria-hidden="true">{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Shown while an image is selected: its alt text, for this language's body. */
function AltBar({ editor, alt, lang }: { editor: Editor; alt: string; lang: string }) {
  const id = useId();
  const [v, setV] = useState(alt);
  const last = useRef(alt);
  // Follow the node when another image is selected, not the user's own typing.
  useEffect(() => { if (alt !== last.current) { last.current = alt; setV(alt); } }, [alt]);
  return (
    <div className="blog-alt">
      <label className="blog-alt__label label" htmlFor={id}>Alt text <span className="blog-alt__lang">{lang.replace(/^Body, /, '')}</span></label>
      <input id={id} className="input input--sm" value={v} placeholder="Describe the image for people who can’t see it" autoComplete="off"
        onChange={(e) => { setV(e.target.value); last.current = e.target.value; editor.chain().updateAttributes('image', { alt: e.target.value }).run(); }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); editor.commands.focus(); } }} />
    </div>
  );
}

function LinkDialog({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const existing = (editor.getAttributes('link').href as string | undefined) ?? '';
  const [url, setUrl] = useState(existing);
  const [error, setError] = useState('');
  const hasSelection = !editor.state.selection.empty;
  const apply = () => {
    const v = url.trim();
    if (!v) { setError('Enter the address to link to.'); return; }
    if (!isUrl(v)) { setError('Enter a full address that starts with https://.'); return; }
    if (!hasSelection && !existing) editor.chain().focus().insertContent({ type: 'text', text: v, marks: [{ type: 'link', attrs: { href: v } }] }).run();
    else editor.chain().focus().extendMarkRange('link').setLink({ href: v }).run();
    onClose();
  };
  return (
    <Dialog title={existing ? 'Edit link' : 'Add a link'} onClose={onClose} initialFocus="input"
      actions={
        <>
          {existing && <button type="button" className="btn btn--ghost" onClick={() => { editor.chain().focus().extendMarkRange('link').unsetLink().run(); onClose(); }}>Remove link</button>}
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn--primary" onClick={apply}>Apply</button>
        </>
      }>
      <div className="field">
        <label className="field__label" htmlFor="blog-link-url">Address</label>
        <input id="blog-link-url" className="input" type="url" inputMode="url" placeholder="https://" value={url} autoComplete="off" aria-invalid={error ? true : undefined}
          onChange={(e) => { setUrl(e.target.value); setError(''); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); apply(); } }} />
        {error && <p className="field__error" role="alert">{error}</p>}
        {!hasSelection && !existing && <p className="field__hint">Select some text first to link it. Without a selection the address itself becomes the link text.</p>}
      </div>
    </Dialog>
  );
}
