import { useId } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Dialog } from '../../components/edit';
import { FormContext, missingSummary } from '../../lib/form';
import type { FormApi } from '../../lib/form';

/** The shared Dialog, drawn on <body>: the season editor is a <form>, and a dialog with its own form must not sit inside it. */
export function Modal(props: React.ComponentProps<typeof Dialog>) {
  return createPortal(<Dialog {...props} />, document.body);
}

/** A dialog that edits a small record with its own form (an extra event, a custom result, an award). */
export function FormDialog<T>({ title, form, onClose, submit, extra, children }: {
  title: string;
  form: FormApi<T>;
  onClose: () => void;
  submit: string;
  /** Another action beside Cancel (for example "Use the FTC Events result"). */
  extra?: ReactNode;
  children: ReactNode;
}) {
  const id = useId();
  const gaps = missingSummary(form.missing);
  return (
    <Modal title={title} onClose={() => { if (!form.saving) onClose(); }} wide
      actions={
        <>
          {extra}
          <button type="button" className="btn btn--ghost" disabled={form.saving} onClick={onClose}>Cancel</button>
          <button type="submit" form={id} className="btn btn--primary" disabled={form.saving}>
            {form.saving ? <><span className="spin" aria-hidden="true" />Saving</> : submit}
          </button>
        </>
      }>
      <FormContext.Provider value={form}>
        <form id={id} className="sea-dform" noValidate onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); void form.save(); }}>
          {children}
          {gaps && <p className="sea-gaps" role="status">{gaps}. You can save now, but the website needs both languages to publish.</p>}
          {form.saveError && <p className="field__error" role="alert">{form.saveError} Nothing you typed was lost: try again, or cancel and come back later.</p>}
        </form>
      </FormContext.Provider>
    </Modal>
  );
}

/** Confirms a destructive or far-reaching step; `body` says what happens. */
export function ConfirmDialog({ title, body, confirm, danger, busy, error, onCancel, onConfirm }: {
  title: string; body: ReactNode; confirm: string; danger?: boolean; busy?: boolean; error?: string | null; onCancel: () => void; onConfirm: () => void;
}) {
  return (
    <Modal role="alertdialog" title={title} onClose={() => { if (!busy) onCancel(); }} initialFocus="[data-keep]"
      actions={
        <>
          <button type="button" className="btn btn--ghost" data-keep disabled={busy} onClick={onCancel}>Cancel</button>
          <button type="button" className={danger ? 'btn btn--ghost' : 'btn btn--primary'} disabled={busy} onClick={onConfirm}>
            {busy ? <><span className="spin" aria-hidden="true" />Working</> : confirm}
          </button>
        </>
      }>
      {body}
      {error && <p className="field__error" role="alert">Couldn’t do that. {error}</p>}
    </Modal>
  );
}

