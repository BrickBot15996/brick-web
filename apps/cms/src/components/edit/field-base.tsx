import { useEffect, useLayoutEffect, useRef } from 'react';
import type { ReactNode } from 'react';

/** Building blocks shared by every field: the label / hint / error shell, the aria wiring, the growing textarea. */

export const fid = (name: string) => `f-${name}`;

export function FieldShell({ id, label, optional, hint, error, children, className = '' }: {
  id: string; label: string; optional?: boolean; hint?: ReactNode; error?: string; children: ReactNode; className?: string;
}) {
  return (
    <div className={`field ${className}`}>
      <label className="field__label" htmlFor={id}>{label}{optional && <span className="field__opt"> Optional</span>}</label>
      {children}
      {hint && <p className="field__hint" id={`${id}-hint`}>{hint}</p>}
      {error && <p className="field__error" id={`${id}-err`}>{error}</p>}
    </div>
  );
}

export const describe = (id: string, hint: unknown, error?: string) => [hint ? `${id}-hint` : '', error ? `${id}-err` : ''].filter(Boolean).join(' ') || undefined;

export function AutoTextarea({ value, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { value: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const fit = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 3}px`;
  };
  useLayoutEffect(fit, [value]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let w = el.clientWidth;
    const ro = new ResizeObserver(() => { if (el.clientWidth !== w) { w = el.clientWidth; fit(); } });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return <textarea ref={ref} value={value} rows={2} {...rest} />;
}

