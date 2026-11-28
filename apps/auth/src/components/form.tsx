import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { Arrow, Eye } from './icons';

type FieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: ReactNode; error?: ReactNode };

export function TextField({ label, hint, error, ...input }: FieldProps) {
  const id = useId();
  const describedBy = [hint && `${id}-hint`, error && `${id}-err`].filter(Boolean).join(' ') || undefined;
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>{label}</label>
      <input id={id} className="input" aria-invalid={error ? true : undefined} aria-describedby={describedBy} {...input} />
      {hint && <p id={`${id}-hint`} className="field__hint">{hint}</p>}
      {error && <p id={`${id}-err`} className="field__error">{error}</p>}
    </div>
  );
}

export function PasswordField({ label, hint, error, ...input }: FieldProps) {
  const id = useId();
  const [shown, setShown] = useState(false);
  const describedBy = [hint && `${id}-hint`, error && `${id}-err`].filter(Boolean).join(' ') || undefined;
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>{label}</label>
      <div className="pw">
        <input id={id} className="input" type={shown ? 'text' : 'password'} aria-invalid={error ? true : undefined} aria-describedby={describedBy}
          autoCapitalize="off" autoCorrect="off" spellCheck={false} {...input} />
        <button type="button" className="pw__toggle" aria-label="Show password" aria-pressed={shown} onClick={() => setShown((s) => !s)}>
          <Eye off={shown} />
        </button>
      </div>
      {hint && <p id={`${id}-hint`} className="field__hint">{hint}</p>}
      {error && <p id={`${id}-err`} className="field__error">{error}</p>}
    </div>
  );
}

export function Submit({ busy, busyLabel, children }: { busy: boolean; busyLabel: string; children: ReactNode }) {
  return (
    <button type="submit" className="btn btn--primary" aria-busy={busy} aria-disabled={busy || undefined}>
      {busy ? <><span className="spin" aria-hidden="true" />{busyLabel}</> : <>{children}<Arrow /></>}
    </button>
  );
}

/** Problems that aren't about one field. role="alert" so they're read out as soon as they appear. */
export function Notice({ tone = 'error', children }: { tone?: 'error' | 'ok'; children: ReactNode }) {
  return <div className={tone === 'ok' ? 'notice notice--ok' : 'notice'} role={tone === 'ok' ? 'status' : 'alert'}>{children}</div>;
}

export function Heading({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header>
      <h1 className="title">{title}</h1>
      {children && <p className="sub">{children}</p>}
    </header>
  );
}
