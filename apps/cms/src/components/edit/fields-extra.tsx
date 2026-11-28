import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { getPath, useForm } from '../../lib/form';
import { inputToIso, isoToInput, ZONE } from '../../lib/dates';
import { Icon } from '../icons';
import { describe, FieldShell, fid } from './field-base';

/**
 * More fields for the same editors. Like the ones in fields.tsx they take a dotted `name`, read and write the
 * surrounding editor's form, and show errors from the module's `validate`. What each stores:
 *   NumberField      number | null          DateField      "YYYY-MM-DD" | ''      DateTimeField  ISO instant (UTC) | ''
 *   ToggleField      boolean                TagPicker      string[] of option values
 */

// ───────── number ─────────

const parseNumber = (t: string): number | null => {
  const s = t.trim().replace(',', '.');
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

/**
 * A number with an optional unit shown inside the field (€, %, min). `min`, `max` and `step` guide the browser (mobile
 * keypad, arrow keys) but never block typing: range rules belong in the module's `validate`, so the error appears
 * after the typing pause like every other field. An empty field stores null.
 */
export function NumberField({ name, label, hint, optional, unit, min, max, step = 1, placeholder, integer }: {
  name: string; label: string; hint?: ReactNode; optional?: boolean;
  /** Suffix inside the field, e.g. "€". */
  unit?: string; min?: number; max?: number; step?: number; placeholder?: string;
  /** Whole numbers only: the mobile keypad has no decimal key. */
  integer?: boolean;
}) {
  const form = useForm();
  const id = fid(name);
  const value = (getPath(form.values, name) as number | null | undefined) ?? null;
  const error = form.errors[name];
  const [text, setText] = useState(value === null ? '' : String(value));
  // Follow the form when it changes under us (discard, reset), but not while the typed text already means the same number.
  useEffect(() => { if (parseNumber(text) !== value) setText(value === null ? '' : String(value)); }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <FieldShell id={id} label={label} optional={optional} hint={hint} error={error}>
      <span className={`numf ${unit ? 'numf--unit' : ''}`}>
        <input id={id} className="input tnum" type="text" inputMode={integer ? 'numeric' : 'decimal'} autoComplete="off" placeholder={placeholder} aria-label={unit ? `${label} (${unit})` : undefined}
          min={min} max={max} step={step} value={text} aria-invalid={error ? true : undefined} aria-describedby={describe(id, hint, error)}
          onChange={(e) => { setText(e.target.value); form.set(name, parseNumber(e.target.value)); }} onBlur={() => form.blur(name)}
          onKeyDown={(e) => {
            if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
            e.preventDefault();
            const cur = parseNumber(text) ?? 0;
            const next = Math.round((cur + (e.key === 'ArrowUp' ? step : -step)) * 1e6) / 1e6;
            setText(String(next));
            form.set(name, next);
          }} />
        {unit && <span className="numf__unit" aria-hidden="true">{unit}</span>}
      </span>
    </FieldShell>
  );
}

// ───────── dates ─────────

/** A calendar date ("YYYY-MM-DD", no time zone). The browser's own date control, styled to the system. */
export function DateField({ name, label, hint, optional, min, max }: {
  name: string; label: string; hint?: ReactNode; optional?: boolean; min?: string; max?: string;
}) {
  const form = useForm();
  const id = fid(name);
  const value = (getPath(form.values, name) as string | undefined) ?? '';
  const error = form.errors[name];
  return (
    <FieldShell id={id} label={label} optional={optional} hint={hint} error={error}>
      <input id={id} className="input input--date" type="date" min={min} max={max} value={value} aria-invalid={error ? true : undefined} aria-describedby={describe(id, hint, error)}
        onChange={(e) => form.set(name, e.target.value)} onBlur={() => form.blur(name)} />
    </FieldShell>
  );
}

/**
 * A date and time, always read and written as Bucharest time (Europe/Bucharest, EET/EEST) whatever the browser's zone.
 * Stores an ISO instant in UTC; empty stores ''. A small note under the field says which zone applies.
 */
export function DateTimeField({ name, label, hint, optional, min, max }: {
  name: string; label: string; hint?: ReactNode; optional?: boolean; min?: string; max?: string;
}) {
  const form = useForm();
  const id = fid(name);
  const iso = (getPath(form.values, name) as string | undefined) ?? '';
  const error = form.errors[name];
  const note = <>{hint ? <>{hint} </> : null}<span className="field__zone">Bucharest time ({ZONE.replace('_', ' ')}).</span></>;
  return (
    <FieldShell id={id} label={label} optional={optional} hint={note} error={error}>
      <input id={id} className="input input--date" type="datetime-local" min={min} max={max} value={isoToInput(iso)} aria-invalid={error ? true : undefined} aria-describedby={describe(id, true, error)}
        onChange={(e) => form.set(name, inputToIso(e.target.value))} onBlur={() => form.blur(name)} />
    </FieldShell>
  );
}

// ───────── toggle ─────────

/**
 * An on/off switch (role="switch"), space or enter toggles. The label sits beside it in plain case, the hint under.
 * Use it for a state ("Featured", "Current season"), not for choosing between two things (use SelectField).
 */
export function ToggleField({ name, label, hint }: { name: string; label: string; hint?: ReactNode }) {
  const form = useForm();
  const id = fid(name);
  const on = Boolean(getPath(form.values, name));
  const error = form.errors[name];
  return (
    <div className="field tgl">
      <div className="tgl__row">
        <button id={id} type="button" role="switch" aria-checked={on} className="tgl__btn" aria-describedby={describe(id, hint, error)} onClick={() => { form.set(name, !on); form.blur(name); }}>
          <span className="tgl__track" aria-hidden="true"><span className="tgl__knob" /></span>
        </button>
        <label className="tgl__label" htmlFor={id}>{label}</label>
      </div>
      {hint && <p className="field__hint" id={`${id}-hint`}>{hint}</p>}
      {error && <p className="field__error" id={`${id}-err`}>{error}</p>}
    </div>
  );
}

// ───────── tags ─────────

const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

/**
 * Pick several from a fixed list (topics, projects). Chosen ones sit as chips you can remove; type to filter the rest,
 * arrows move, Enter adds, Backspace on an empty field removes the last chip, Escape closes the list. `max` caps the
 * count. Options come from the module (usually a query); an unknown stored value still shows, by its raw text.
 */
export function TagPicker({ name, label, hint, optional, options, placeholder = 'Type to find…', max, emptyText = 'Nothing else to add.' }: {
  name: string; label: string; hint?: ReactNode; optional?: boolean;
  options: { value: string; label: string }[];
  placeholder?: string; max?: number; emptyText?: string;
}) {
  const form = useForm();
  const id = fid(name);
  const listId = useId();
  const value = (getPath(form.values, name) as string[] | undefined) ?? [];
  const error = form.errors[name];
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [note, setNote] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const full = max !== undefined && value.length >= max;
  const labelOf = (v: string) => options.find((o) => o.value === v)?.label ?? v;

  const shown = useMemo(() => {
    const n = norm(q.trim());
    return options.filter((o) => !value.includes(o.value) && (!n || norm(o.label).includes(n)));
  }, [options, value, q]);
  useEffect(() => { setActive(0); }, [q, value.length]);
  useEffect(() => { if (open) document.getElementById(`${listId}-o${active}`)?.scrollIntoView({ block: 'nearest' }); }, [active, open, listId]);

  const add = (v: string) => {
    if (full) return;
    form.set(name, [...value, v]);
    form.blur(name);
    setQ('');
    setNote(`${labelOf(v)} added.`);
  };
  const remove = (v: string) => {
    form.set(name, value.filter((x) => x !== v));
    setNote(`${labelOf(v)} removed.`);
    input.current?.focus();
  };

  const key = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setOpen(true);
      if (shown.length) setActive((i) => (e.key === 'ArrowDown' ? (i + 1) % shown.length : (i - 1 + shown.length) % shown.length));
    } else if (e.key === 'Enter') {
      if (open && shown[active]) { e.preventDefault(); add(shown[active].value); }
      else e.preventDefault();
    } else if (e.key === 'Escape') {
      if (open) { e.preventDefault(); e.stopPropagation(); setOpen(false); }
    } else if (e.key === 'Backspace' && q === '' && value.length) {
      remove(value[value.length - 1]);
    }
  };

  const expanded = open && !full;
  return (
    <FieldShell id={id} label={label} optional={optional} hint={hint} error={error}>
      <div className="tags" data-invalid={error ? true : undefined} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) { setOpen(false); form.blur(name); } }}>
        <ul className="tags__chips" aria-label={`${label}, chosen`}>
          {value.map((v) => (
            <li key={v} className="tagc">
              <span>{labelOf(v)}</span>
              <button type="button" className="tagc__x" aria-label={`Remove ${labelOf(v)}`} onClick={() => remove(v)}><Icon name="close" /></button>
            </li>
          ))}
        </ul>
        <input ref={input} id={id} className="tags__in" type="text" role="combobox" aria-expanded={expanded} aria-controls={listId} aria-autocomplete="list" aria-invalid={error ? true : undefined}
          aria-activedescendant={expanded && shown.length ? `${listId}-o${active}` : undefined} aria-describedby={describe(id, hint, error)}
          placeholder={full ? `Up to ${max}` : value.length ? '' : placeholder} disabled={full} autoComplete="off" spellCheck={false} value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onClick={() => setOpen(true)} onKeyDown={key} />
        <div className="tags__list" id={listId} role="listbox" aria-label={`${label} options`} hidden={!expanded}>
          {shown.map((o, i) => (
            <div key={o.value} id={`${listId}-o${i}`} role="option" aria-selected={i === active} className="tags__opt"
              onPointerMove={() => i !== active && setActive(i)} onPointerDown={(e) => e.preventDefault()} onClick={() => add(o.value)}>
              {o.label}
            </div>
          ))}
          {!shown.length && <p className="tags__empty">{q.trim() ? <>Nothing matches <b>{q.trim()}</b>.</> : emptyText}</p>}
        </div>
      </div>
      <p className="sr-only" role="status" aria-live="polite">{note}</p>
    </FieldShell>
  );
}
