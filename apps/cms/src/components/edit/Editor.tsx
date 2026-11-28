import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useBlocker, useRouter } from '@tanstack/react-router';
import { FormContext, missingSummary } from '../../lib/form';
import type { FormApi } from '../../lib/form';
import { editedWhen } from '../../lib/format';
import { useShell } from '../../lib/shell';
import { AppLink } from '../AppLink';
import { Icon } from '../icons';
import { PageHeader } from '../PageHeader';
import { Dialog } from './Dialog';

/**
 * The right half of the list → edit pattern. Wrap a module's fields in it and pass the form from `useEditForm`:
 * it draws the header (name, last edited, View on site, Delete), the sticky save bar, and guards leaving with unsaved
 * changes (router blocker, `beforeunload`) and deleting (a confirm that names the item). ⌘S / Ctrl+S saves.
 */
export function EditorFrame<T>({ form, title, edited, back, viewHref, remove, inHeader, children }: {
  form: FormApi<T>;
  /** The item's name, or "New project" while unsaved. */
  title: string;
  /** Who saved it last and when; null for an item that has not been saved yet. */
  edited: { by: string; at: string } | null;
  /** The link back to the list (shown below 1100px, where the list is a separate screen). Omit for a single-record page. */
  back?: { href: string; label: string };
  /** The public page, when it exists. */
  viewHref?: string;
  /** Omit for a new item. */
  remove?: { noun: string; run: () => Promise<unknown>; then: string };
  /** Single-record pages: the module's name is already the page title, so "last edited" and the buttons go to the page header row instead of an editor header. */
  inHeader?: boolean;
  children: ReactNode;
}) {
  const { session } = useShell();
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);

  const blocker = useBlocker({ shouldBlockFn: () => form.isDirty(), withResolver: true, enableBeforeUnload: () => form.isDirty() });

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (form.dirty && !form.saving) void form.save();
      }
    };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, [form]);

  const by = edited?.by ? (edited.by === session.email ? 'You' : edited.by) : null;

  const editedLine = edited && by ? <>Last edited by <b>{by}</b> · <time dateTime={edited.at}>{editedWhen(edited.at)}</time></> : edited ? 'Not edited in the CMS yet' : 'Not saved yet';
  const actions = (
    <>
      {viewHref && <a className="btn btn--ghost btn--sm" href={viewHref} target="_blank" rel="noreferrer"><span className="ed__lbl">View on site<span className="sr-only"> (opens in a new tab)</span></span><Icon name="external" /></a>}
      {remove && <button type="button" className="btn btn--ghost btn--sm" onClick={() => setConfirm(true)}><Icon name="trash" /><span className="ed__lbl">Delete</span></button>}
    </>
  );

  return (
    <FormContext.Provider value={form}>
      <div className="ed" data-inheader={inHeader ? '' : undefined}>
        {inHeader ? <PageHeader sub={editedLine} actions={actions} /> : (
          <header className="ed__head">
            {back && <AppLink href={back.href} className="link ed__back"><Icon name="arrow" className="i flip" />{back.label}</AppLink>}
            <div className="ed__titlerow">
              <h2 className="ed__title">{title}</h2>
              <div className="ed__actions">{actions}</div>
            </div>
            <p className="ed__edited">{editedLine}</p>
          </header>
        )}

        <form className="ed__form" noValidate onSubmit={(e) => { e.preventDefault(); void form.save(); }}>
          <div className="ed__body">{children}</div>
          <SaveBar form={form} />
        </form>

        {confirm && remove && (
          <DeleteDialog noun={remove.noun} name={title} onCancel={() => setConfirm(false)}
            onConfirm={async () => {
              await remove.run();
              form.markClean();
              router.history.push(remove.then);
            }} />
        )}
        {blocker.status === 'blocked' && (
          <Dialog role="alertdialog" title="Leave without saving?" onClose={() => blocker.reset()} initialFocus="[data-stay]"
            actions={
              <>
                <button type="button" className="btn btn--ghost" onClick={() => blocker.proceed()}>Leave and discard</button>
                <button type="button" className="btn btn--primary" data-stay onClick={() => blocker.reset()}>Keep editing</button>
              </>
            }>
            <p>You have unsaved changes to <b>{title}</b>. If you leave now they are lost.</p>
          </Dialog>
        )}
      </div>
    </FormContext.Provider>
  );
}

function DeleteDialog({ noun, name, onCancel, onConfirm }: { noun: string; name: string; onCancel: () => void; onConfirm: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const go = async () => {
    setBusy(true);
    setError(null);
    try { await onConfirm(); } catch (e) { setError(e instanceof Error && e.message ? e.message : 'Try again.'); setBusy(false); }
  };
  return (
    <Dialog role="alertdialog" title={`Delete ${name}?`} onClose={() => { if (!busy) onCancel(); }} initialFocus="[data-keep]"
      actions={
        <>
          <button type="button" className="btn btn--ghost" data-keep disabled={busy} onClick={onCancel}>Keep {noun}</button>
          <button type="button" className="btn btn--primary" disabled={busy} onClick={() => void go()}>
            {busy ? <><span className="spin" aria-hidden="true" />Deleting</> : `Delete ${noun}`}
          </button>
        </>
      }>
      <p>This removes <b>{name}</b> from the CMS. It leaves the website on the next Publish. It can’t be undone.</p>
      {error && <p className="field__error" role="alert">Couldn’t delete it. {error}</p>}
    </Dialog>
  );
}

/** The sticky bar: saved, unsaved (Discard + Save), busy, error; plus how many translations are missing. */
export function SaveBar<T>({ form }: { form: FormApi<T> }) {
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    if (!form.savedAt) return;
    setFlash(true);
    const t = setTimeout(() => setFlash(false), 7000);
    return () => clearTimeout(t);
  }, [form.savedAt]);

  const gap = missingSummary(form.missing);
  let status: ReactNode;
  if (form.saving) status = <><span className="spin spin--sm" aria-hidden="true" />Saving…</>;
  else if (form.saveError) status = <span className="sbar__err" role="alert"><Icon name="alert" /><span>{form.saveError}<span className="sbar__next"> Your changes are still here. Press Save to try again.</span></span></span>;
  else if (form.dirty) status = <><span className="led led--dirty" aria-hidden="true" />Unsaved changes</>;
  else if (flash) status = <><Icon name="check" className="i sbar__ok" />Saved. It goes live on the next Publish.</>;
  else status = <><span className="led led--idle" aria-hidden="true" />All changes saved</>;

  return (
    <div className="sbar" data-state={form.saving ? 'busy' : form.saveError ? 'error' : form.dirty ? 'dirty' : 'clean'}>
      <div className="sbar__info">
        <p className="sbar__status" role="status">{status}</p>
        {gap && <p className="sbar__gap"><Icon name="alert" />{gap}</p>}
      </div>
      <div className="sbar__btns">
        {form.dirty && !form.saving && <button type="button" className="btn btn--ghost btn--sm" onClick={form.discard}>Discard</button>}
        <button type="submit" className="btn btn--primary btn--sm sbar__save" disabled={!form.dirty || form.saving}>
          {form.saving ? <><span className="spin spin--sm" aria-hidden="true" />Saving</> : 'Save'}
        </button>
      </div>
    </div>
  );
}
