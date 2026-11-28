import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { auth, errorCode, MIN_PASSWORD, type LinkKind } from '../lib/auth';
import { saveFlow } from '../lib/flow';
import { usePausedCheck } from '../lib/check';
import { Heading, Notice, PasswordField, Submit } from '../components/form';
import { Arrow } from '../components/icons';

const copy = {
  reset: {
    title: 'Set a new password', intro: 'for', label: 'New password', button: 'Save password', busy: 'Saving',
    expiredTitle: 'This link has expired',
    expiredBody: 'Reset links work once, for 1 hour. Ask for a fresh one and use the newest email.',
  },
  invite: {
    title: 'Create your account', intro: 'You’ve been invited to BrickBot’s team tools. Choose a password for', label: 'Password',
    button: 'Create account', busy: 'Creating account',
    expiredTitle: 'This invite has expired',
    expiredBody: 'Invite links work once and expire after a while. Ask the admin who invited you to send a new one.',
  },
} as const;

const lengthProblem = (v: string) =>
  v.length < MIN_PASSWORD ? `Use at least ${MIN_PASSWORD} characters${v ? ` (${v.length} so far)` : ''}.` : undefined;

/**
 * Both email links land here. /reset sets a new password; /invite creates the account: the invite link proves the
 * inbox, the member picks a password (typed twice), and they go straight in.
 */
export function SetPassword({ kind }: { kind: LinkKind }) {
  const t = copy[kind];
  const confirmNeeded = kind === 'invite';
  const { token } = useSearch({ strict: false }) as { token?: string };
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const lengthCheck = usePausedCheck(password, lengthProblem);
  const matchCheck = usePausedCheck(confirm, (v) => (!v ? 'Type the password again.' : v !== password ? 'The passwords don’t match.' : undefined));

  const link = useQuery({ queryKey: ['link', kind, token], queryFn: () => auth.openLink(kind, token), retry: false, staleTime: Infinity });
  const save = useMutation({
    mutationFn: () => auth.setPassword(kind, token ?? '', password),
    onSuccess: () => {
      if (link.data) { saveFlow({ email: link.data.email }); navigate({ to: '/done' }); } // the link's session is already verified
    },
  });
  const email = link.data?.email ?? '';
  const linkErr = link.isError ? errorCode(link.error) : null;
  const saveErr = save.isError ? errorCode(save.error) : null;

  const back = <Link className="back back--left" to="/"><Arrow back />Back to sign in</Link>;

  if (link.isPending) {
    return <div className="step" aria-busy="true"><Heading title={t.title}>Checking your link…</Heading></div>;
  }
  if (linkErr === 'link-expired') {
    return (
      <div className="step" key="expired">
        <Heading title={t.expiredTitle}>{t.expiredBody}</Heading>
        <div className="form">
          {kind === 'reset' && <Link className="btn btn--primary" to="/forgot">Send a new link<Arrow /></Link>}
          <p>{back}</p>
        </div>
      </div>
    );
  }
  if (linkErr) {
    return (
      <div className="step" key="offline">
        <Heading title={t.title} />
        <div className="form">
          <Notice>Can’t reach the server. Check your connection, then <button type="button" className="link" onClick={() => link.refetch()}>try again</button>.</Notice>
        </div>
      </div>
    );
  }
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    lengthCheck.reveal(true);
    if (confirmNeeded) matchCheck.reveal(true);
    const bad = !lengthCheck.ok ? 'new-password' : confirmNeeded && !matchCheck.ok ? 'confirm-password' : null;
    if (bad) { (e.currentTarget.elements.namedItem(bad) as HTMLInputElement | null)?.focus(); return; }
    if (!save.isPending) save.mutate();
  }

  const lengthError = lengthCheck.error ?? (saveErr === 'weak-password' ? lengthProblem(password) : undefined);
  return (
    <div className="step">
      <Heading title={t.title}>{t.intro} <strong>{email}</strong>.</Heading>
      <form className="form" onSubmit={submit} noValidate>
        {saveErr === 'network' && <Notice>Can’t reach the server. Check your connection and try again.</Notice>}
        {saveErr === 'link-expired' && (
          <Notice>
            This link expired while you were typing.{' '}
            {kind === 'reset' ? <Link to="/forgot">Ask for a new one</Link> : 'Ask the admin who invited you to send a new one.'}
          </Notice>
        )}
        {/* hidden username so password managers save the new password against the right account */}
        <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
        <PasswordField label={t.label} name="new-password" autoComplete="new-password" required autoFocus minLength={MIN_PASSWORD}
          value={password} onChange={(e) => setPassword(e.target.value)} onBlur={() => lengthCheck.reveal()}
          hint={lengthError ? undefined : `At least ${MIN_PASSWORD} characters. A short sentence works well.`} error={lengthError} />
        {confirmNeeded && (
          <PasswordField label="Confirm password" name="confirm-password" autoComplete="new-password" required
            value={confirm} onChange={(e) => setConfirm(e.target.value)} onBlur={() => matchCheck.reveal()} error={matchCheck.error} />
        )}
        <Submit busy={save.isPending} busyLabel={t.busy}>{t.button}</Submit>
        {kind === 'reset' && <p>{back}</p>}
      </form>
    </div>
  );
}
