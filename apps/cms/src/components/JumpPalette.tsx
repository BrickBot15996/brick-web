import { useEffect, useRef } from 'react';
import type { Session } from '../lib/data';
import { JUMP_FOCUS, JumpCombobox } from './JumpCombobox';

/** ⌘K / Ctrl+K anywhere, and "/" outside text fields, open the same jump field as a lit overlay. */
export function JumpPalette({ session, open, onOpen, onClose, onPublish }: {
  session: Session;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onPublish: () => void;
}) {
  const from = useRef<HTMLElement | null>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
      // On Home the jump field is already on the page: the shortcut focuses it instead of stacking an overlay above a copy of it.
      const open = () => {
        if (document.querySelector('.jump--inline')) window.dispatchEvent(new Event(JUMP_FOCUS));
        else onOpen();
      };
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); open(); }
      else if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); open(); }
    };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, [onOpen]);

  useEffect(() => {
    if (!open) return;
    from.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      const el = from.current;
      if (el && document.contains(el)) el.focus();
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="jump__overlay" onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="jump__panel" role="dialog" aria-modal="true" aria-label="Jump to">
        <JumpCombobox session={session} variant="overlay" autoFocus inputRef={input} onClose={onClose} onPublish={onPublish} />
      </div>
    </div>
  );
}
