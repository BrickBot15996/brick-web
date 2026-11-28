import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';

/**
 * A small accessible modal: labelled, focus moves in and is trapped, Escape closes, focus returns to what opened it.
 * Use it only where interrupting is right (guarding against data loss, a picker that needs a decision).
 */
export function Dialog({ title, onClose, children, actions, wide, role = 'dialog', initialFocus }: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  actions: ReactNode;
  wide?: boolean;
  role?: 'dialog' | 'alertdialog';
  /** CSS selector inside the dialog for the first focus; defaults to the first control. */
  initialFocus?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const from = useRef<HTMLElement | null>(null);
  const id = useId();

  useEffect(() => {
    from.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    const target = (initialFocus && box.current?.querySelector<HTMLElement>(initialFocus)) || box.current?.querySelector<HTMLElement>('button, input, select, a[href]');
    target?.focus();
    return () => {
      document.body.style.overflow = '';
      const el = from.current;
      if (el && document.contains(el)) el.focus();
    };
    // Focus is set once, on open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const key = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onClose(); return; }
    if (e.key !== 'Tab') return;
    const f = Array.from(box.current?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])') ?? []);
    if (!f.length) return;
    const a = document.activeElement;
    if (e.shiftKey && a === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && a === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  };

  return (
    <div className="dlg__scrim" onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`dlg ${wide ? 'dlg--wide' : ''}`} role={role} aria-modal="true" aria-labelledby={id} ref={box} onKeyDown={key}>
        <h2 id={id} className="dlg__title">{title}</h2>
        <div className="dlg__body">{children}</div>
        <div className="dlg__actions">{actions}</div>
      </div>
    </div>
  );
}
