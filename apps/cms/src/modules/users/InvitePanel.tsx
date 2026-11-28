import { useMemo } from 'react';
import { FormContext, FieldError, useEditForm } from '../../lib/form';
import type { Errors } from '../../lib/form';
import { TextField } from '../../components/edit';
import { useInvite } from './data/hooks';
import type { AdminUser, PermissionDef } from './data/types';
import { AdminNote, SidePanel } from './parts';

interface Values { email: string; permissions: string[] }
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Invite a member: an email and the permissions they start with. They get an email to set a password. */
export function InvitePanel({ users, catalog, onClose, onSent }: { users: AdminUser[]; catalog: PermissionDef[]; onClose: () => void; onSent: (email: string) => void }) {
  const invite = useInvite();
  const taken = useMemo(() => new Set(users.map((u) => u.email.toLowerCase())), [users]);
  const validate = (v: Values): Errors => {
    const e: Errors = {}, m = v.email.trim().toLowerCase();
    if (!m) e.email = 'Enter the member’s email address.';
    else if (!emailRe.test(m)) e.email = 'That does not look like an email address.';
    else if (taken.has(m)) e.email = 'This email already has an account.';
    return e;
  };
  const form = useEditForm<Values>({
    initial: { email: '', permissions: [] },
    validate,
    save: async (v) => {
      try { return await invite.mutateAsync({ email: v.email.trim(), permissions: v.permissions }); }
      catch (err) { throw new FieldError('email', err instanceof Error ? err.message : 'Try again.'); }
    },
    onSaved: (_r, v) => { onSent(v.email.trim().toLowerCase()); onClose(); },
  });
  const picked = form.values.permissions;
  const toggle = (id: string) => form.set('permissions', picked.includes(id) ? picked.filter((p) => p !== id) : [...picked, id]);
  const onlyAdmin = picked.length > 0 && picked.every((p) => p === 'admin');

  return (
    <FormContext.Provider value={form}>
      <form onSubmit={(e) => { e.preventDefault(); void form.save(); }} className="sidep__form" noValidate>
        <SidePanel title="Invite a member" onClose={onClose}
          footer={
            <>
              <button type="button" className="btn btn--ghost" onClick={onClose} disabled={form.saving}>Cancel</button>
              <button type="submit" className="btn btn--primary" disabled={form.saving}>
                {form.saving ? <><span className="spin" aria-hidden="true" />Sending</> : 'Send invite'}
              </button>
            </>
          }>
          <p className="adm-lead">They get an email from BrickBot with a link to set a password. The invite stays pending until they do.</p>
          <TextField name="email" label="Email" type="email" placeholder="name@brickbot.ro" />
          <fieldset className="adm-checks">
            <legend className="field__label">Permissions</legend>
            <p className="field__hint">You can change these later in Permissions.</p>
            {catalog.map((p) => (
              <label key={p.id} className="adm-check">
                <input type="checkbox" checked={picked.includes(p.id)} onChange={() => toggle(p.id)} />
                <span className="adm-check__txt"><span className="adm-check__name">{p.id}</span><span className="adm-check__desc">{p.description}</span></span>
              </label>
            ))}
          </fieldset>
          {onlyAdmin && <AdminNote>This member would be able to manage members but not edit any content. Add <b>cms.website</b> or <b>cms.links</b> if they should.</AdminNote>}
          {picked.length === 0 && <p className="adm-hint">With no permissions they can sign in but will see no apps.</p>}
          {form.saveError && <p className="field__error" role="alert">{form.saveError} Nothing you typed was lost: try again, or cancel and come back later.</p>}
        </SidePanel>
      </form>
    </FormContext.Provider>
  );
}
