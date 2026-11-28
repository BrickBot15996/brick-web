import { useEffect, useId, useRef, useState } from 'react';
import { Tag } from '../Tag';
import type { ReactNode } from 'react';
import { getPath, missingIn, setPath, useForm } from '../../lib/form';
import type { Bilingual } from '../../lib/data';
import { Icon } from '../icons';
import { AutoTextarea, describe, FieldShell, fid } from './field-base';

export { ImageField } from './FileField';
export { fid } from './field-base';

/**
 * The field set of the list → edit pattern. Each field takes a dotted `name` ("name.en", "stats.0.value") and reads
 * and writes the surrounding editor's form, so a module's editor just lists them. Labels sit above in the Label style;
 * errors and hints sit under the field; text that is not required says "Optional".
 */

export function TextField({ name, label, hint, optional, type = 'text', inputMode, placeholder, multiline, className }: {
  name: string; label: string; hint?: ReactNode; optional?: boolean; type?: 'text' | 'url' | 'email'; inputMode?: 'url' | 'text' | 'numeric'; placeholder?: string; multiline?: boolean; className?: string;
}) {
  const form = useForm();
  const id = fid(name);
  const value = (getPath(form.values, name) as string | undefined) ?? '';
  const error = form.errors[name];
  const common = {
    id, value, placeholder, 'aria-invalid': error ? true : undefined, 'aria-describedby': describe(id, hint, error),
    onChange: (e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => form.set(name, e.target.value),
    onBlur: () => form.blur(name),
  };
  return (
    <FieldShell id={id} label={label} optional={optional} hint={hint} error={error} className={className}>
      {multiline ? <AutoTextarea className="input input--area" {...common} /> : <input className="input" type={type} inputMode={inputMode ?? (type === 'url' ? 'url' : undefined)} autoComplete="off" spellCheck={type === 'text'} {...common} />}
    </FieldShell>
  );
}

export function SlugField({ name, label = 'Slug', hint, prefix, onManualEdit }: { name: string; label?: string; hint?: ReactNode; prefix?: string; onManualEdit?: () => void }) {
  const form = useForm();
  const id = fid(name);
  const value = (getPath(form.values, name) as string | undefined) ?? '';
  const error = form.errors[name];
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <span className="slug">
        {prefix && <span className="slug__pre" aria-hidden="true">{prefix}</span>}
        <input id={id} className="input slug__in" value={value} autoComplete="off" spellCheck={false} aria-invalid={error ? true : undefined} aria-describedby={describe(id, hint, error)}
          onChange={(e) => { onManualEdit?.(); form.set(name, e.target.value); }} onBlur={() => form.blur(name)} />
      </span>
    </FieldShell>
  );
}

export function SelectField({ name, label, hint, options, placeholder, optional }: {
  name: string; label: string; hint?: ReactNode; options: { value: string; label: string }[]; placeholder?: string; optional?: boolean;
}) {
  const form = useForm();
  const id = fid(name);
  const value = (getPath(form.values, name) as string | undefined) ?? '';
  const error = form.errors[name];
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} optional={optional}>
      <select id={id} className="input input--select" value={value} aria-invalid={error ? true : undefined} aria-describedby={describe(id, hint, error)}
        onChange={(e) => { form.set(name, e.target.value); form.blur(name); }}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </FieldShell>
  );
}

/** EN | RO side by side under one label; a missing language is flagged on its own column. Phones stack EN above RO. */
export function BilingualField({ name, label, hint, optional, multiline, softMax, placeholder, markdown }: {
  name: string; label: string; hint?: ReactNode; optional?: boolean; multiline?: boolean;
  /** A soft character count: it informs, it never blocks. */
  softMax?: number; placeholder?: string;
  /** Long copy written in Markdown (use BilingualMarkdownField). */
  markdown?: boolean;
}) {
  const form = useForm();
  const base = fid(name);
  const labelId = `${base}-label`;
  const pair = (getPath(form.values, name) as Bilingual | undefined) ?? { en: '', ro: '' };
  // The gap is read from the settled values: it appears after the typing pause, on blur or on save, never mid-word.
  const gap = missingIn((getPath(form.settled, name) as Bilingual | undefined) ?? pair);
  return (
    <div className="field field--bi" role="group" aria-labelledby={labelId} aria-describedby={hint ? `${base}-hint` : undefined}>
      <span className="field__label" id={labelId}>{label}{optional && <span className="field__opt"> Optional</span>}{markdown && <Tag className="field__md">Markdown</Tag>}</span>
      <div className="bi">
        {(['en', 'ro'] as const).map((lang) => {
          const path = `${name}.${lang}`;
          const id = fid(path);
          const error = form.errors[path];
          const flagged = gap === lang && !error;
          const text = pair[lang];
          const common = {
            id, value: text, placeholder: lang === 'en' ? placeholder : undefined, 'aria-label': `${label}, ${lang === 'en' ? 'English' : 'Romanian'}`,
            'aria-invalid': error ? true : undefined,
            'aria-describedby': [error ? `${id}-err` : '', flagged ? `${id}-gap` : ''].filter(Boolean).join(' ') || undefined,
            'data-missing': gap === lang ? true : undefined,
            onChange: (e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => form.set(path, e.target.value),
            onBlur: () => form.blur(path),
          };
          return (
            <div className="bi__col" key={lang}>
              <Tag className="langtag" decorative>{lang.toUpperCase()}</Tag>
              {multiline ? <AutoTextarea className={`input input--area${markdown ? ' input--long' : ''}`} lang={lang} {...common} /> : <input className="input" lang={lang} autoComplete="off" {...common} />}
              {error && <p className="field__error" id={`${id}-err`}>{error}</p>}
              {flagged && <p className="field__gap" id={`${id}-gap`}><Icon name="alert" />{lang === 'ro' ? 'Romanian is missing.' : 'English is missing.'}</p>}
              {softMax !== undefined && (
                <p className={`field__count tnum ${text.trim().length > softMax ? 'field__count--over' : ''}`} aria-hidden={text.trim().length <= softMax}>
                  {text.trim().length} / {softMax}{text.trim().length > softMax ? ' · try one short sentence' : ''}
                </p>
              )}
            </div>
          );
        })}
      </div>
      {hint && <p className="field__hint" id={`${base}-hint`}>{hint}</p>}
    </div>
  );
}

/**
 * Longer copy in both languages: one plain textarea per language, stored as Markdown text. A short "Markdown" tag
 * beside the label says what it accepts; the hint (if any) sits under it. Use it for descriptions, never for names.
 */
export function BilingualMarkdownField(props: Omit<React.ComponentProps<typeof BilingualField>, 'multiline' | 'markdown'>) {
  return <BilingualField {...props} multiline markdown hint={props.hint ?? 'Markdown: **bold**, *italic*, lists with “-”, [links](https://…). A blank line starts a new paragraph.'} />;
}

/** A repeatable group: add, remove, move up and down. Items need a stable `k` (see `uid`). */
export function Repeater({ name, label, hint, itemLabel, addLabel, max, empty, blank, children }: {
  name: string; label: string; hint?: ReactNode; itemLabel: string; addLabel: string; max?: number; empty: string;
  blank: () => { k: string };
  children: (index: number) => ReactNode;
}) {
  const form = useForm();
  const items = (getPath(form.values, name) as { k: string }[] | undefined) ?? [];
  const root = useRef<HTMLDivElement>(null);
  const [note, setNote] = useState('');
  const focusNext = useRef<string | null>(null);
  const id = useId();
  const full = max !== undefined && items.length >= max;

  useEffect(() => {
    if (!focusNext.current) return;
    const el = root.current?.querySelector<HTMLElement>(`[data-act="${focusNext.current}"]:not(:disabled)`);
    focusNext.current = null;
    el?.focus();
  });

  const swap = (i: number, to: number) => {
    const k = items[i].k;
    form.update((v) => {
      const arr = [...(getPath(v, name) as unknown[])];
      [arr[i], arr[to]] = [arr[to], arr[i]];
      return setPath(v, name, arr);
    });
    setNote(`${itemLabel} moved to position ${to + 1} of ${items.length}.`);
    const dir = to < i ? 'up' : 'down';
    focusNext.current = `${k}:${dir}`;
    // If the item hit the end it can't go further that way, so land on the other arrow.
    if ((dir === 'up' && to === 0) || (dir === 'down' && to === items.length - 1)) focusNext.current = `${k}:${dir === 'up' ? 'down' : 'up'}`;
  };
  const remove = (i: number) => {
    form.update((v) => setPath(v, name, (getPath(v, name) as unknown[]).filter((_, j) => j !== i)));
    setNote(`${itemLabel} ${i + 1} removed.`);
    focusNext.current = 'add';
    if (full) root.current?.focus();
  };

  return (
    <div className="field rep" role="group" aria-labelledby={`${id}-l`} ref={root} tabIndex={-1}>
      <span className="field__label" id={`${id}-l`}>{label}{max !== undefined && <span className="field__opt tnum"> {items.length} of {max}</span>}</span>
      {hint && <p className="field__hint">{hint}</p>}
      {items.length === 0 && <p className="rep__empty">{empty}</p>}
      <ol className="rep__list">
        {items.map((it, i) => (
          <li key={it.k} className="rep__item">
            <div className="rep__bar">
              <span className="rep__n">{itemLabel} {i + 1}</span>
              <span className="rep__btns">
                <button type="button" className="iconbtn iconbtn--sm" data-act={`${it.k}:up`} aria-label={`Move ${itemLabel.toLowerCase()} ${i + 1} up`} disabled={i === 0} onClick={() => swap(i, i - 1)}><Icon name="up" /></button>
                <button type="button" className="iconbtn iconbtn--sm" data-act={`${it.k}:down`} aria-label={`Move ${itemLabel.toLowerCase()} ${i + 1} down`} disabled={i === items.length - 1} onClick={() => swap(i, i + 1)}><Icon name="down" /></button>
                <button type="button" className="iconbtn iconbtn--sm" aria-label={`Remove ${itemLabel.toLowerCase()} ${i + 1}`} onClick={() => remove(i)}><Icon name="trash" /></button>
              </span>
            </div>
            <div className="rep__fields">{children(i)}</div>
          </li>
        ))}
      </ol>
      <button type="button" className="btn btn--ghost btn--sm rep__add" data-act="add" disabled={full} onClick={() => { form.update((v) => setPath(v, name, [...((getPath(v, name) as unknown[]) ?? []), blank()])); }}>
        <Icon name="plus" />{full ? `Up to ${max} ${label.toLowerCase()}` : addLabel}
      </button>
      <p className="sr-only" role="status">{note}</p>
    </div>
  );
}

/** A titled group of fields inside an editor. `off` greys it out and disables everything in it. */
export function Section({ title, note, off, offNote, children }: { title: string; note?: ReactNode; off?: boolean; offNote?: string; children: ReactNode }) {
  const id = useId();
  return (
    <fieldset className="esec" aria-labelledby={id} disabled={off}>
      <h3 className="esec__title" id={id}>{title}</h3>
      {off && offNote && <p className="esec__off">{offNote}</p>}
      {note && <p className="esec__note">{note}</p>}
      <div className="esec__body">{children}</div>
    </fieldset>
  );
}

/** A calm note inside an editor, for a state the editor should explain (not an error). */
export function Callout({ children }: { children: ReactNode }) {
  return <p className="callout"><Icon name="alert" /><span>{children}</span></p>;
}
